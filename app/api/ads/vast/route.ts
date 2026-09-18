import { NextResponse } from "next/server";

import { publicEnv } from "@/lib/config/env";
import { serverEnv } from "@/lib/config/server-env";
import { clientKey, rateLimit } from "@/lib/utils/rate-limit";
import { logError } from "@/lib/utils/errors";

/**
 * GET /api/ads/vast?position=preroll|midroll|postroll
 *
 * Returns the advertising provider's VAST/VMAP document for one break.
 *
 * Why this route exists:
 *  - AD_PROVIDER_TAG is a *private* credential. It is read here, server-side,
 *    and never sent to the browser.
 *  - Public tags (NEXT_PUBLIC_AD_VAST_TAG_URL) usually lack CORS headers, so
 *    the browser could not read them directly anyway.
 *
 * It is intentionally NOT a general-purpose proxy: the destination comes only
 * from environment configuration, never from the request, so it cannot be
 * pointed at internal hosts.
 */

export const dynamic = "force-dynamic";

const ALLOWED_POSITIONS = new Set(["preroll", "midroll", "postroll"]);
const MAX_BYTES = 256 * 1024;
const TIMEOUT_MS = 5_000;

/** Private tag wins; otherwise fall back to the public VMAP/VAST tag. */
function resolveTagUrl(): string | null {
  const candidates = [
    serverEnv.adProviderTag,
    publicEnv.adVmapTagUrl,
    publicEnv.adVastTagUrl,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const url = new URL(candidate);
      if (url.protocol === "https:") return url.toString();
    } catch {
      // Ignore malformed configuration rather than throwing at request time.
    }
  }
  return null;
}

function noAd(reason: string) {
  // An empty VAST document is the spec-compliant "no ad" answer.
  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><VAST version="4.0"/>', {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Ad-Status": reason,
    },
  });
}

/**
 * Read at most MAX_BYTES from the response, aborting as soon as the cap is
 * exceeded. Returns null when the document is too large, so a misconfigured or
 * hostile tag URL cannot make this route buffer an unbounded body.
 */
async function readCapped(response: Response): Promise<string | null> {
  const body = response.body;
  if (!body) return "";

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel().catch(() => undefined);
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
  return text + decoder.decode();
}

export async function GET(request: Request) {
  if (!publicEnv.adEnabled) return noAd("ads-disabled");

  const limit = rateLimit(clientKey(request, "ads"), 60, 60_000);
  if (!limit.allowed) return noAd("rate-limited");

  const position = new URL(request.url).searchParams.get("position") ?? "preroll";
  if (!ALLOWED_POSITIONS.has(position)) return noAd("bad-position");

  const tagUrl = resolveTagUrl();
  if (!tagUrl) return noAd("no-tag-configured");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const upstream = await fetch(tagUrl, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/xml, text/xml;q=0.9, */*;q=0.5" },
    });

    if (!upstream.ok) return noAd(`upstream-${upstream.status}`);

    // Refuse an oversized document before buffering it, when the upstream is
    // honest enough to declare a length.
    const declared = Number(upstream.headers.get("content-length") ?? "");
    if (Number.isFinite(declared) && declared > MAX_BYTES) return noAd("too-large");

    const body = await readCapped(upstream);
    if (body === null) return noAd("too-large");

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Ad-Status": "ok",
      },
    });
  } catch (error) {
    logError("api/ads/vast", error);
    return noAd("upstream-error");
  } finally {
    clearTimeout(timer);
  }
}
