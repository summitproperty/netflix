/**
 * Minimal VAST 2/3/4 reader — enough to play a linear creative and report the
 * impression honestly.
 *
 * Deliberately small and deliberately dumb: it extracts the media file, the
 * duration, the skip offset, the provider's impression pixels and the real
 * click-through URL. It does not synthesise clicks, does not fire click
 * trackers on its own, and does not follow redirects on the viewer's behalf.
 */

export interface LinearAd {
  title: string;
  mediaUrl: string;
  mediaType: string;
  durationSeconds: number;
  /** Seconds before "Skip ad" is offered; 0 means immediately skippable. */
  skipOffsetSeconds: number;
  /** Fired once, when the creative actually starts playing. */
  impressionUrls: string[];
  /** Landing page, opened only if the viewer clicks the labelled link. */
  clickThroughUrl: string | null;
  /** Provider trackers for a genuine viewer click. */
  clickTrackingUrls: string[];
}

const PLAYABLE = /^video\/(mp4|webm|ogg)$/i;

function textOf(parent: Element | Document, selector: string): string {
  const node = parent.querySelector(selector);
  return node?.textContent?.trim() ?? "";
}

function allText(parent: Element | Document, selector: string): string[] {
  return Array.from(parent.querySelectorAll(selector))
    .map((node) => node.textContent?.trim() ?? "")
    .filter((value) => value.startsWith("https://") || value.startsWith("http://"));
}

/** "00:00:15" | "00:00:15.500" -> 15 */
export function parseTimeOffset(raw: string): number {
  const trimmed = raw.trim();
  if (trimmed === "") return 0;

  if (trimmed.endsWith("%")) {
    // Percentage offsets need the content duration, which we do not own for
    // third-party embeds; treat them as "skippable soon".
    return 5;
  }

  const parts = trimmed.split(":").map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) return 0;

  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0];
}

/**
 * Parse a VAST document. Returns null for wrappers, empty responses or
 * creatives we cannot play in a plain <video> element — the caller then simply
 * skips the break, which is always the safe outcome.
 */
export function parseVast(xml: string): LinearAd | null {
  if (typeof DOMParser === "undefined") return null;

  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(xml, "application/xml");
  } catch {
    return null;
  }

  if (doc.querySelector("parsererror")) return null;

  const linear = doc.querySelector("Linear");
  if (!linear) return null;

  const candidates = Array.from(linear.querySelectorAll("MediaFile"))
    .map((node) => ({
      url: node.textContent?.trim() ?? "",
      type: node.getAttribute("type") ?? "",
      height: Number(node.getAttribute("height") ?? "0"),
    }))
    .filter((file) => file.url.startsWith("https://") && PLAYABLE.test(file.type))
    // Prefer a mid-size rendition: good enough, cheap to start.
    .sort((a, b) => a.height - b.height);

  const chosen = candidates.find((file) => file.height >= 360) ?? candidates[0];
  if (!chosen) return null;

  const skipOffsetAttr = linear.getAttribute("skipoffset") ?? "";

  return {
    title: textOf(doc, "AdTitle") || "Advertisement",
    mediaUrl: chosen.url,
    mediaType: chosen.type,
    durationSeconds: parseTimeOffset(textOf(linear, "Duration")),
    skipOffsetSeconds: skipOffsetAttr ? parseTimeOffset(skipOffsetAttr) : 5,
    impressionUrls: allText(doc, "Impression"),
    clickThroughUrl: textOf(linear, "ClickThrough") || null,
    clickTrackingUrls: allText(linear, "ClickTracking"),
  };
}

/**
 * Fire the provider's impression pixels. Called once, only after the creative
 * has actually begun playing — never on render, never on a timer.
 */
export function reportImpressions(urls: string[]): void {
  for (const url of urls.slice(0, 5)) {
    try {
      // Fire-and-forget beacon; no response is read and no cookies are set by us.
      void fetch(url, { method: "GET", mode: "no-cors", keepalive: true });
    } catch {
      // Tracking must never break playback.
    }
  }
}
