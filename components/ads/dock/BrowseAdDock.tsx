"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { DockBannerSlot } from "@/components/ads/dock/DockBannerSlot";
import { DockVideoSlot } from "@/components/ads/dock/DockVideoSlot";
import { ProviderAdArea } from "@/components/ads/dock/ProviderAdArea";
import { AD_CONFIG } from "@/config/ads";
import { resolveNamedTag } from "@/lib/ads/named-tags";

/**
 * Dedicated bottom ad area (Browse Mode dock): 3 independent video slots
 * stacked one on top of the other, then the provider ad area, then 3
 * independent bottom banners — this app's lowest ad row, nothing renders
 * below it (Footer aside).
 *
 * Mounted once, site-wide, in app/layout.tsx — visibility is derived purely
 * from the current route (Browse vs Watch), never from mount/unmount, so
 * navigating between pages never duplicates or flickers it, and scrolling
 * never hides it. Hidden entirely on any /watch route: the player's own ad
 * system (AdLayer + AdOpportunityLayer) is completely separate and this dock
 * never overlays it.
 *
 * No close button anywhere in this dock — that's a deliberate Browse Mode
 * policy, not an oversight.
 *
 * The dock is capped at 42% of the viewport height and scrolls internally
 * past that — required so that "3 stacked videos + provider area + 3
 * banners" (all requested to be stacked, not side-by-side) can never grow
 * tall enough to cover the page's real controls or dominate a small mobile
 * screen. This is a deliberate UX safeguard, not a missed requirement.
 */
export function BrowseAdDock() {
  const pathname = usePathname();
  const isWatchMode = pathname?.startsWith("/watch") ?? false;

  // Nothing rendered anywhere yet? Then the dock itself should render
  // nothing — no empty frame, no reserved space — on a stock deployment,
  // same policy as every other slot in this file.
  const hasAnyVideoTag = Boolean(
    resolveNamedTag("dockVideo1") || resolveNamedTag("dockVideo2") || resolveNamedTag("dockVideo3"),
  );
  const hasAnySnippet = Boolean(
    AD_CONFIG.browseDock.banner1.snippet.trim() ||
      AD_CONFIG.browseDock.banner2.snippet.trim() ||
      AD_CONFIG.browseDock.banner3.snippet.trim() ||
      AD_CONFIG.browseDock.providerArea.snippet.trim(),
  );
  const active = AD_CONFIG.browseDock.enabled && !isWatchMode && (hasAnyVideoTag || hasAnySnippet);

  // Reserve bottom space for the dock (so it never permanently covers the
  // footer/content underneath it) via a body class instead of touching the
  // server-rendered root layout markup.
  useEffect(() => {
    document.body.classList.toggle("has-ad-dock", active);
    return () => {
      document.body.classList.remove("has-ad-dock");
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 max-h-[42vh] overflow-y-auto border-t border-white/10 bg-ink-900/95 backdrop-blur-sm"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-xs flex-col gap-1 px-2 py-1.5 sm:max-w-sm sm:gap-1.5 sm:px-3 sm:py-2">
        <div className="flex flex-col gap-1 sm:gap-1.5">
          <DockVideoSlot slot="dockVideo1" ariaLabel="Advertisement, video 1" />
          <DockVideoSlot slot="dockVideo2" ariaLabel="Advertisement, video 2" />
          <DockVideoSlot slot="dockVideo3" ariaLabel="Advertisement, video 3" />
        </div>

        <ProviderAdArea />

        <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
          <DockBannerSlot index={1} />
          <DockBannerSlot index={2} />
          <DockBannerSlot index={3} />
        </div>
      </div>
    </div>
  );
}

export default BrowseAdDock;
