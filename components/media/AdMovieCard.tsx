import { RawSnippet } from "@/components/ads/RawSnippet";
import { AD_CONFIG } from "@/config/ads";

/**
 * One occasional ad card inserted into a movie row, sized exactly like a
 * real MovieCard (components/media/MovieCard.tsx) — same width classes,
 * same aspect-[2/3] poster box, same rounded-lg/border treatment — so it
 * reads as a normal slot in that row rather than an oversized banner.
 *
 * This is always an addition to the row, never a replacement: MovieRow never
 * removes a movie to make room for it (see components/media/MovieRow.tsx).
 * Renders nothing (no card at all — the row looks completely normal) until a
 * snippet is configured in AD_CONFIG.movieCardAd.
 */
export function AdMovieCard() {
  const { enabled, snippet } = AD_CONFIG.movieCardAd;
  const trimmed = snippet.trim();
  if (!enabled || !trimmed) return null;

  return (
    <article
      className="group/card relative w-[44vw] max-w-[190px] shrink-0 xs:w-[150px] sm:w-[170px]"
      aria-label="Advertisement"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border border-white/5 bg-ink-700 shadow-card">
        <span className="absolute left-1.5 top-1.5 z-10 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold backdrop-blur">
          Sponsored
        </span>
        <div className="flex h-full w-full items-center justify-center overflow-hidden">
          <RawSnippet html={trimmed} />
        </div>
      </div>
      <p className="mt-0.5 text-xs text-mist-500">Advertisement</p>
    </article>
  );
}

export default AdMovieCard;
