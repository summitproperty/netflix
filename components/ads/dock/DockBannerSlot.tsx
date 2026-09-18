import { RawSnippet } from "@/components/ads/RawSnippet";
import { AD_CONFIG } from "@/config/ads";

interface DockBannerSlotProps {
  index: 1 | 2 | 3;
}

const CONFIG_KEY = {
  1: "banner1",
  2: "banner2",
  3: "banner3",
} as const;

/**
 * One banner slot in the Browse Mode dock's bottom banner row (the site's
 * lowest ad row — nothing renders below it). Renders the pasted provider
 * snippet exactly once — any further in-slot rotation/refresh for a display
 * banner is the ad network's own script's responsibility (its own
 * frequency/refresh rules), so this component never re-triggers it. Renders
 * nothing (no reserved box) until a snippet is configured.
 */
export function DockBannerSlot({ index }: DockBannerSlotProps) {
  const config = AD_CONFIG.browseDock[CONFIG_KEY[index]];
  const snippet = config.snippet.trim();

  if (!AD_CONFIG.browseDock.enabled || !snippet) return null;

  return (
    <div
      role="group"
      aria-label={`Advertisement, bottom banner ${index}`}
      className="flex h-[50px] w-full items-center justify-center overflow-hidden rounded-md border border-white/5 bg-ink-900/60 sm:h-[60px]"
    >
      <RawSnippet html={snippet} />
    </div>
  );
}

export default DockBannerSlot;
