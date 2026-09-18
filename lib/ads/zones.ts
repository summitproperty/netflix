import { publicEnv } from "@/lib/config/env";

/**
 * Display ("banner") ad slot registry — deliberately EMPTY by default.
 *
 * Why this file exists
 * --------------------
 * The video ad layer (lib/ads/config.ts) covers pre/mid/post-roll VAST breaks.
 * This is the separate, static side: four fixed regions of the page where the
 * site owner may later drop a display zone from a network such as ExoClick.
 *
 * What ships today
 * ----------------
 * Nothing renders. Every slot needs BOTH
 *   1. NEXT_PUBLIC_BANNER_ADS_ENABLED=true, and
 *   2. a zone id for that specific slot (NEXT_PUBLIC_AD_ZONE_*),
 * and both default to empty/false. So an unconfigured deployment shows no ad
 * markup, loads no third-party script, and reserves no blank space.
 *
 * Adding ExoClick later (no code changes required)
 * -----------------------------------------------
 *   NEXT_PUBLIC_BANNER_ADS_ENABLED=true
 *   NEXT_PUBLIC_AD_DISPLAY_NETWORK=exoclick
 *   NEXT_PUBLIC_AD_DISPLAY_SCRIPT_URL=https://a.magsrv.com/ad-provider.js
 *   NEXT_PUBLIC_AD_DISPLAY_TAG_CLASS=<the class ExoClick shows in your zone code>
 *   NEXT_PUBLIC_AD_ZONE_WATCH_BELOW_PLAYER=<numeric zone id>
 * The class name and script URL are configuration, not constants, so a
 * different network (or a changed ExoClick endpoint) is also just env edits.
 *
 * Policy — unchanged from the video layer
 * --------------------------------------
 * These are in-flow, clearly labelled containers only. This layer cannot and
 * does not implement pop-ups, pop-unders, interstitials, overlays on top of the
 * player, invisible or stacked click areas, auto-clicks, forced redirects or
 * anything else that manipulates an ad network. It renders one provider-issued
 * tag inside a bordered box captioned "Advertisement", in normal document flow.
 */

export type AdZoneId =
  | "home-top"
  | "list-footer"
  | "detail-below"
  | "watch-below-player";

export interface AdZone {
  id: AdZoneId;
  /** Shown in the reserved-space outline and used as the region's label. */
  label: string;
  /** Env key that carries this slot's zone id, quoted in docs and the outline. */
  envKey: string;
  /** Provider zone id, empty when unconfigured. */
  zoneId: string;
  /**
   * Space to reserve, in px, so filling the slot later does not shift layout.
   * Sized for the common leaderboard/rectangle formats.
   */
  minHeight: number;
  desktopMinHeight: number;
}

const ZONES: Record<AdZoneId, Omit<AdZone, "zoneId">> = {
  "home-top": {
    id: "home-top",
    label: "Homepage, above the first row",
    envKey: "NEXT_PUBLIC_AD_ZONE_HOME_TOP",
    minHeight: 100,
    desktopMinHeight: 90,
  },
  "list-footer": {
    id: "list-footer",
    label: "Browse pages, below the grid",
    envKey: "NEXT_PUBLIC_AD_ZONE_LIST_FOOTER",
    minHeight: 100,
    desktopMinHeight: 90,
  },
  "detail-below": {
    id: "detail-below",
    label: "Title details, below the cast",
    envKey: "NEXT_PUBLIC_AD_ZONE_DETAIL_BELOW",
    minHeight: 250,
    desktopMinHeight: 250,
  },
  "watch-below-player": {
    id: "watch-below-player",
    label: "Watch page, below the player",
    envKey: "NEXT_PUBLIC_AD_ZONE_WATCH_BELOW_PLAYER",
    minHeight: 100,
    desktopMinHeight: 90,
  },
};

/** Env-configured zone ids, one per slot. */
const ZONE_IDS: Record<AdZoneId, string> = {
  "home-top": publicEnv.adZoneHomeTop,
  "list-footer": publicEnv.adZoneListFooter,
  "detail-below": publicEnv.adZoneDetailBelow,
  "watch-below-player": publicEnv.adZoneWatchBelowPlayer,
};

export interface DisplayAdConfig {
  /** Master switch for every display slot. */
  enabled: boolean;
  network: string;
  /** Provider loader script. Must be https; empty disables the whole layer. */
  scriptUrl: string;
  /** Class the provider expects on its <ins> container. */
  tagClass: string;
  /** Draw a labelled dashed box where unfilled slots sit (dev aid). */
  outline: boolean;
}

function httpsOnly(raw: string): string {
  if (raw === "") return "";
  try {
    const url = new URL(raw);
    // A third-party script over http: would be blocked as mixed content and
    // would downgrade the whole page, so refuse it here instead.
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export const displayAdConfig: DisplayAdConfig = {
  enabled: publicEnv.bannerAdsEnabled,
  network: publicEnv.adDisplayNetwork,
  scriptUrl: httpsOnly(publicEnv.adDisplayScriptUrl),
  tagClass: publicEnv.adDisplayTagClass,
  outline: publicEnv.adSlotOutline,
};

/**
 * Resolve one slot. `zoneId` is empty whenever the slot must stay blank, which
 * is every slot until the owner configures the network.
 */
export function getAdZone(id: AdZoneId): AdZone {
  return { ...ZONES[id], zoneId: ZONE_IDS[id] };
}

/** True only when this exact slot can serve: master switch + script + zone id. */
export function isZoneServable(id: AdZoneId): boolean {
  return (
    displayAdConfig.enabled &&
    displayAdConfig.scriptUrl !== "" &&
    displayAdConfig.tagClass !== "" &&
    ZONE_IDS[id] !== ""
  );
}

/** Every slot, for the README table and the /profile-style config summaries. */
export function listAdZones(): AdZone[] {
  return (Object.keys(ZONES) as AdZoneId[]).map(getAdZone);
}
