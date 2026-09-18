import { NextResponse } from "next/server";

import { NAMED_AD_SLOTS, resolveNamedTag, type NamedAdSlot } from "@/lib/ads/named-tags";
import { clientKey, rateLimit } from "@/lib/utils/rate-limit";
import { logError } from "@/lib/utils/errors";

/**
 * GET /api/ads/vast-tag?slot=floating|inpage|slot1|slot2|slot3|slot4|slot5
 *
 * Returns the VAST document for one of the named ad slots configured in
 * config/ads.ts (with an env-variable fallback — see lib/ads/named-tags.ts).
 *
 * Same shape and same safety rules as /api/ads/vast:
 *  - `slot` is checked against a fixed allow-list; the actual destination URL
 *    always comes from server-side configuration, never from the request, so
 *    this cannot be pointed at an arbitrary host.
 *  - Inline VAST XML pasted directly into config/ads.ts never reaches this
 *    route — it is parsed client-side instead (see requestNamedAd).
 *  - Response body is capped and the upstream fetch is timed out.
 */

export const dynamic = "force-dynamic";

const MAX_BYTES = 256 * 1024;
const TIMEOUT_MS = 5_000;

function noAd(reason: string) {
  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><VAST version="4.0"/>', {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Ad-Status": reason,
    },
  });
}

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
  const slotParam = new URL(request.url).searchParams.get("slot") ?? "";
  if (!NAMED_AD_SLOTS.includes(slotParam as NamedAdSlot)) return noAd("bad-slot");
  const slot = slotParam as NamedAdSlot;

  const limit = rateLimit(clientKey(request, `ads-${slot}`), 60, 60_000);
  if (!limit.allowed) return noAd("rate-limited");

  const tag = resolveNamedTag(slot);
  if (!tag) return noAd("no-tag-configured");
  if (!tag.startsWith("http")) return noAd("inline-tag");

  let tagUrl: URL;
  try {
    tagUrl = new URL(tag);
    if (tagUrl.protocol !== "https:") return noAd("insecure-tag");
  } catch {
    return noAd("bad-tag-url");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const upstream = await fetch(tagUrl.toString(), {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/xml, text/xml;q=0.9, */*;q=0.5" },
    });

    if (!upstream.ok) return noAd(`upstream-${upstream.status}`);

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
    logError("api/ads/vast-tag", error);
    return noAd("upstream-error");
  } finally {
    clearTimeout(timer);
  }
}
