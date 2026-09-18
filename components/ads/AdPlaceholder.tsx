"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

import { displayAdConfig, getAdZone, isZoneServable, type AdZoneId } from "@/lib/ads/zones";
import { cn } from "@/lib/utils/cn";

interface AdPlaceholderProps {
  zone: AdZoneId;
  className?: string;
}

/**
 * A reserved display-ad slot.
 *
 * Three states, in order of precedence:
 *
 *  1. Servable — master switch on, https loader script set, tag class set and
 *     this zone has an id. Renders the provider's <ins> container plus the
 *     loader script, captioned "Advertisement".
 *  2. Outline — NEXT_PUBLIC_AD_SLOT_OUTLINE=true (or development). Renders a
 *     dashed box naming the slot and the env key to fill, so the layout can be
 *     checked before a network exists.
 *  3. Nothing — the default. No markup, no reserved space, no third-party
 *     request. This is what a stock deployment does.
 *
 * The component never injects HTML from configuration: the zone id lands in a
 * data-* attribute and the class name is applied as a class. There is no
 * dangerouslySetInnerHTML anywhere in this layer.
 */
export function AdPlaceholder({ zone, className }: AdPlaceholderProps) {
  const meta = getAdZone(zone);
  const servable = isZoneServable(zone);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (!servable || !scriptReady) return;

    /*
     * The ExoClick-style contract: the loader drains a global queue, and each
     * <ins> on the page needs one "serve" push. Guarded because a blocked or
     * partially loaded script leaves the global undefined.
     */
    try {
      const holder = window as typeof window & { AdProvider?: unknown[] };
      holder.AdProvider = holder.AdProvider ?? [];
      holder.AdProvider.push({ serve: {} });
    } catch {
      // A failed ad slot must never break the page it sits on.
    }
  }, [servable, scriptReady]);

  if (servable) {
    // Reserved height is a CSS variable pair so .ad-slot-frame can pick the
    // mobile or desktop format without a Tailwind class per size.
    const style = {
      "--ad-slot-min-h": `${meta.minHeight}px`,
      "--ad-slot-desktop-min-h": `${meta.desktopMinHeight}px`,
    } as React.CSSProperties;

    return (
      <aside
        aria-label="Advertisement"
        className={cn("my-6 flex flex-col items-center gap-1.5", className)}
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mist-500">
          Advertisement
        </span>
        <div className="ad-slot-frame" style={style}>
          {/* Provider container. The class and zone id both come from env. */}
          <ins
            className={displayAdConfig.tagClass}
            data-zoneid={meta.zoneId}
            style={{ display: "block" }}
          />
        </div>
        <Script
          id="display-ad-loader"
          src={displayAdConfig.scriptUrl}
          strategy="lazyOnload"
          onReady={() => setScriptReady(true)}
        />
      </aside>
    );
  }

  const showOutline =
    displayAdConfig.outline || process.env.NODE_ENV === "development";
  if (!showOutline) return null;

  return (
    <div
      // Purely a build-time layout aid: hidden from assistive tech, no links,
      // nothing clickable, and absent from production unless explicitly asked
      // for via NEXT_PUBLIC_AD_SLOT_OUTLINE.
      aria-hidden="true"
      data-ad-slot={meta.id}
      className={cn(
        "my-6 flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/12 bg-white/[0.02] px-4 py-6 text-center",
        className,
      )}
      style={{ minHeight: `${meta.minHeight}px` }}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mist-500">
        Ad slot · {meta.id}
      </span>
      <span className="text-xs text-mist-500">{meta.label}</span>
      <code className="mt-1 rounded bg-black/40 px-2 py-0.5 text-[11px] text-mist-300">
        {meta.envKey}
      </code>
    </div>
  );
}

export default AdPlaceholder;
