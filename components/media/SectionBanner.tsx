import { RawSnippet } from "@/components/ads/RawSnippet";
import { AD_CONFIG } from "@/config/ads";

/**
 * One banner between two major homepage sections (e.g. Trending → Top).
 * Distinct from the movie-card ad and from the bottom dock's banners.
 * Renders nothing until a snippet is configured.
 */
export function SectionBanner() {
  const { enabled, snippet } = AD_CONFIG.sectionBanner;
  const trimmed = snippet.trim();
  if (!enabled || !trimmed) return null;

  return (
    <div className="container-page py-3">
      <div
        role="group"
        aria-label="Advertisement"
        className="flex min-h-[90px] w-full items-center justify-center overflow-hidden rounded-xl border border-white/5 bg-ink-800/40"
      >
        <RawSnippet html={trimmed} />
      </div>
    </div>
  );
}

export default SectionBanner;
