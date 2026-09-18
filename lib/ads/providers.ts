import { adConfig, type AdCue } from "@/lib/ads/config";
import { parseVast, reportImpressions, type LinearAd } from "@/lib/ads/vast";

/**
 * Ad provider adapter.
 *
 * Components never fetch a tag themselves: they ask the active provider for a
 * break. Swapping ad networks means adding one adapter here (or just pointing
 * the env tag URLs somewhere else) — no component changes.
 *
 * All tag retrieval goes through the same-origin route /api/ads/vast, which
 * fetches whichever tag the operator configured. That keeps a *private* tag
 * (AD_PROVIDER_TAG) on the server and avoids CORS problems with public tags.
 */

export interface AdBreak {
  cue: AdCue;
  ad: LinearAd;
}

export interface AdProviderAdapter {
  id: string;
  label: string;
  /** False when the operator has not supplied any tag. */
  isConfigured(): boolean;
  /** Resolves the creative for a break, or null to skip it silently. */
  requestBreak(cue: AdCue, signal?: AbortSignal): Promise<AdBreak | null>;
  /** Impression reporting, only ever called on real playback start. */
  reportImpression(ad: LinearAd): void;
}

/** Adapter for any provider that serves standard VAST/VMAP tags. */
const vastAdapter: AdProviderAdapter = {
  id: "vast",
  label: "VAST / VMAP",

  isConfigured() {
    // The private server-side tag is invisible here by design, so the route
    // itself reports whether anything is configured (see /api/ads/vast).
    return adConfig.enabled;
  },

  async requestBreak(cue, signal) {
    try {
      const response = await fetch(
        `/api/ads/vast?position=${encodeURIComponent(cue.position)}`,
        { signal, cache: "no-store" },
      );
      if (!response.ok) return null;

      const xml = await response.text();
      const ad = parseVast(xml);
      if (!ad) return null;

      return { cue, ad };
    } catch {
      // A failed ad request must never block the title.
      return null;
    }
  },

  reportImpression(ad) {
    reportImpressions(ad.impressionUrls);
  },
};

/** Adapter used when advertising is off: it resolves nothing. */
const noopAdapter: AdProviderAdapter = {
  id: "none",
  label: "Disabled",
  isConfigured: () => false,
  requestBreak: async () => null,
  reportImpression: () => {},
};

export function getAdProvider(): AdProviderAdapter {
  if (!adConfig.enabled) return noopAdapter;

  switch (adConfig.provider.toLowerCase()) {
    case "vast":
    case "vmap":
    case "ima":
      return vastAdapter;
    case "none":
    case "off":
      return noopAdapter;
    default:
      // Unknown provider names still get the standard VAST path, since that is
      // what virtually every network serves.
      return vastAdapter;
  }
}
