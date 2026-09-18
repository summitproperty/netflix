import { publicEnv } from "@/lib/config/env";

/**
 * Central advertising configuration.
 *
 * Every timing and toggle comes from one place (env → this object), so the whole
 * ad behaviour can be retuned without touching components.
 *
 * Policy, enforced by this layer and the components that consume it:
 *  - Ads are OFF unless NEXT_PUBLIC_AD_ENABLED is true AND a legitimate tag has
 *    been configured by the advertising provider.
 *  - Only provider-supplied VAST/VMAP tags are used.
 *  - No automated clicks, no synthetic impressions, no hidden or overlapping
 *    click areas, no deceptive buttons, no forced redirects. Impressions are
 *    only reported when an ad actually starts playing, and the click-through is
 *    a single clearly labelled link the viewer chooses to activate.
 *  - No banner ads, interstitials or pop-ups anywhere in the app.
 */

export type AdPosition = "preroll" | "midroll" | "postroll";

export interface AdConfig {
  enabled: boolean;
  provider: string;
  preroll: boolean;
  midroll: boolean;
  postroll: boolean;
  /** Minutes of uninterrupted playback before the first mid-roll. */
  initialAdFreeMinutes: number;
  /** Minutes between mid-rolls after the ad-free window. */
  midrollIntervalMinutes: number;
  /** Hard cap on mid-rolls per viewing session. */
  midrollMaxPerSession: number;
  /** Public tag URLs (optional; a private server-side tag can be used instead). */
  vastTagUrl: string;
  vmapTagUrl: string;
  /** Kept for completeness — must stay false; the UI never renders banners. */
  bannerAdsEnabled: boolean;
}

export const adConfig: AdConfig = {
  enabled: publicEnv.adEnabled,
  provider: publicEnv.adProvider,
  preroll: publicEnv.prerollEnabled,
  midroll: publicEnv.midrollEnabled,
  postroll: publicEnv.postrollEnabled,
  initialAdFreeMinutes: publicEnv.initialAdFreeMinutes,
  midrollIntervalMinutes: Math.max(publicEnv.midrollIntervalMinutes, 1),
  midrollMaxPerSession: publicEnv.midrollMaxPerSession,
  vastTagUrl: publicEnv.adVastTagUrl,
  vmapTagUrl: publicEnv.adVmapTagUrl,
  bannerAdsEnabled: false,
};

export interface AdCue {
  id: string;
  position: AdPosition;
  /** Seconds into the viewing session when this break becomes due. */
  offsetSeconds: number;
}

/**
 * Build the break schedule for one title.
 *
 * `durationMinutes` is the TMDB runtime, used only to stop scheduling mid-rolls
 * past the end of the title and to place the post-roll. Unknown runtimes fall
 * back to a conservative 100 minutes.
 */
export function buildAdSchedule(durationMinutes: number | null | undefined): AdCue[] {
  if (!adConfig.enabled) return [];

  const runtime = durationMinutes && durationMinutes > 0 ? durationMinutes : 100;
  const cues: AdCue[] = [];

  if (adConfig.preroll) {
    cues.push({ id: "preroll", position: "preroll", offsetSeconds: 0 });
  }

  if (adConfig.midroll && adConfig.midrollMaxPerSession > 0) {
    const start = Math.max(adConfig.initialAdFreeMinutes, 0);
    const step = adConfig.midrollIntervalMinutes;

    for (let index = 0; index < adConfig.midrollMaxPerSession; index += 1) {
      const minute = start + index * step;
      // Leave the last two minutes alone: nobody wants a break over the finale.
      if (minute <= 0 || minute >= runtime - 2) break;
      cues.push({
        id: `midroll-${index + 1}`,
        position: "midroll",
        offsetSeconds: Math.round(minute * 60),
      });
    }
  }

  if (adConfig.postroll) {
    cues.push({
      id: "postroll",
      position: "postroll",
      offsetSeconds: Math.round(runtime * 60),
    });
  }

  return cues;
}

/** Human-readable summary, shown to viewers before playback starts. */
export function describeAdPolicy(): string | null {
  if (!adConfig.enabled) return null;

  const parts: string[] = [];
  if (adConfig.preroll) parts.push("one ad before playback");
  if (adConfig.midroll && adConfig.midrollMaxPerSession > 0) {
    parts.push(
      `up to ${adConfig.midrollMaxPerSession} break${
        adConfig.midrollMaxPerSession === 1 ? "" : "s"
      } after the first ${adConfig.initialAdFreeMinutes} ad-free minutes`,
    );
  }
  if (parts.length === 0) return null;
  return `This title includes ${parts.join(" and ")}. Breaks are skippable.`;
}
