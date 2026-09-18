import { AD_CONFIG } from "@/config/ads";
import { publicEnv } from "@/lib/config/env";

/**
 * Named ad slots outside the pre-existing preroll/mid/post-roll system:
 * the 3 stacked Browse Mode dock video slots, one legacy floating slot, one
 * legacy in-page slot, and the 5 player opportunity slots. Used by
 * /api/ads/vast-tag as an allow-list (the route only ever resolves a tag
 * from this fixed set of names — never from a request-supplied URL).
 */
export type NamedAdSlot =
  | "dockVideo1"
  | "dockVideo2"
  | "dockVideo3"
  | "floating"
  | "inpage"
  | "slot1"
  | "slot2"
  | "slot3"
  | "slot4"
  | "slot5";

export const NAMED_AD_SLOTS: NamedAdSlot[] = [
  "dockVideo1",
  "dockVideo2",
  "dockVideo3",
  "floating",
  "inpage",
  "slot1",
  "slot2",
  "slot3",
  "slot4",
  "slot5",
];

/** config/ads.ts wins; the matching NEXT_PUBLIC_AD_* env var is the fallback. */
function pick(configValue: string, envValue: string): string {
  const fromConfig = configValue.trim();
  return fromConfig !== "" ? fromConfig : envValue.trim();
}

/** Resolve one named slot to a tag value: a tag URL, raw VAST XML, or "". */
export function resolveNamedTag(slot: NamedAdSlot): string {
  switch (slot) {
    case "dockVideo1":
      return AD_CONFIG.browseDock.enabled
        ? pick(AD_CONFIG.browseDock.video1.vastTag, publicEnv.adDockVideo1VastTagUrl)
        : "";
    case "dockVideo2":
      return AD_CONFIG.browseDock.enabled
        ? pick(AD_CONFIG.browseDock.video2.vastTag, publicEnv.adDockVideo2VastTagUrl)
        : "";
    case "dockVideo3":
      return AD_CONFIG.browseDock.enabled
        ? pick(AD_CONFIG.browseDock.video3.vastTag, publicEnv.adDockVideo3VastTagUrl)
        : "";
    case "floating":
      return AD_CONFIG.floatingVideo.enabled
        ? pick(AD_CONFIG.floatingVideo.vastTag, publicEnv.adFloatingVastTagUrl)
        : "";
    case "inpage":
      return AD_CONFIG.inPageVideo.enabled
        ? pick(AD_CONFIG.inPageVideo.vastTag, publicEnv.adInPageVastTagUrl)
        : "";
    case "slot1":
      return pick(AD_CONFIG.slots.slot1.vastTag, publicEnv.adSlot1VastTagUrl);
    case "slot2":
      return pick(AD_CONFIG.slots.slot2.vastTag, publicEnv.adSlot2VastTagUrl);
    case "slot3":
      return pick(AD_CONFIG.slots.slot3.vastTag, publicEnv.adSlot3VastTagUrl);
    case "slot4":
      return pick(AD_CONFIG.slots.slot4.vastTag, publicEnv.adSlot4VastTagUrl);
    case "slot5":
      return pick(AD_CONFIG.slots.slot5.vastTag, publicEnv.adSlot5VastTagUrl);
    default:
      return "";
  }
}
