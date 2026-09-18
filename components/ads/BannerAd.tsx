import { AdPlaceholder } from "@/components/ads/AdPlaceholder";
import { RawSnippet } from "@/components/ads/RawSnippet";
import { AD_CONFIG } from "@/config/ads";
import type { AdZoneId } from "@/lib/ads/zones";

interface BannerAdProps {
  zone: AdZoneId;
}

/**
 * Banner ad slot.
 *
 * If AD_CONFIG.banner.snippet has a pasted ExoClick <ins>/<script> snippet,
 * that renders directly. Otherwise this falls back to the pre-existing
 * env-configured display-zone system (lib/ads/zones.ts / AdPlaceholder),
 * which is already ExoClick-ready — so a deployment that prefers env-only
 * configuration keeps working exactly as before.
 */
export function BannerAd({ zone }: BannerAdProps) {
  const { enabled, snippet } = AD_CONFIG.banner;

  if (enabled && snippet.trim() !== "") {
    return (
      <aside aria-label="Advertisement" className="my-6 flex flex-col items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mist-500">
          Advertisement
        </span>
        <div className="w-full">
          <RawSnippet html={snippet} />
        </div>
      </aside>
    );
  }

  return <AdPlaceholder zone={zone} />;
}

export default BannerAd;
