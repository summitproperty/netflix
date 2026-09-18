import { resolveNamedTag, type NamedAdSlot } from "@/lib/ads/named-tags";
import { parseVast, type LinearAd } from "@/lib/ads/vast";

/**
 * Resolve one named ad slot (floating / inpage / slot1..slot5) to a playable
 * creative, or null.
 *
 * - An empty tag resolves to null immediately — no request is made.
 * - Raw VAST XML pasted directly into config/ads.ts is parsed in the browser,
 *   no network round-trip needed.
 * - A tag URL is fetched through the same-origin /api/ads/vast-tag proxy
 *   (CORS-safe, size-capped, timed out server-side).
 *
 * Any failure — network, parse, missing config — resolves to null so the
 * caller can silently skip the opportunity. This never throws.
 */
export async function requestNamedAd(
  slot: NamedAdSlot,
  signal?: AbortSignal,
): Promise<LinearAd | null> {
  try {
    const tag = resolveNamedTag(slot);
    if (!tag) return null;

    if (tag.startsWith("<")) {
      return parseVast(tag);
    }

    const response = await fetch(`/api/ads/vast-tag?slot=${encodeURIComponent(slot)}`, {
      signal,
      cache: "no-store",
    });
    if (!response.ok) return null;

    const xml = await response.text();
    return parseVast(xml);
  } catch {
    return null;
  }
}
