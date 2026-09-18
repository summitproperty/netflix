import Image from "next/image";
import Link from "next/link";

import { PlayIcon } from "@/components/ui/Icons";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { posterUrl } from "@/lib/tmdb/images";
import { cn } from "@/lib/utils/cn";
import type { MediaItem } from "@/types/media";

interface MovieCardProps {
  item: MediaItem;
  /** Rail cards get a fixed width; grid cards fill their cell. */
  layout?: "rail" | "grid";
  /** Eager-load the first few cards above the fold. */
  priority?: boolean;
  className?: string;
}

const TYPE_LABEL: Record<MediaItem["mediaType"], string> = {
  movie: "Movie",
  tv: "TV",
};

/**
 * `sizes` per layout. Rail cards have a fixed width, so their hints are exact.
 * Grid cards fill a cell, and MediaGrid's column count changes at every
 * breakpoint (2 / xs:3 / sm:4 / lg:6 / xl:7) — one shared string would make the
 * optimizer pick a poster roughly twice as wide as it needs on desktop.
 */
const SIZES = {
  rail: "(max-width: 440px) 44vw, (max-width: 1024px) 170px, 190px",
  grid:
    "(max-width: 440px) 48vw, (max-width: 640px) 32vw, (max-width: 1024px) 24vw, (max-width: 1280px) 16vw, 190px",
} as const;

/**
 * Poster card used by every rail and grid. Server component (no client JS): the
 * hover treatment is pure CSS so scrolling long rails stays cheap.
 */
export function MovieCard({
  item,
  layout = "rail",
  priority = false,
  className,
}: MovieCardProps) {
  const poster = posterUrl(item.posterPath, "w342");

  return (
    <article
      className={cn(
        "group/card relative",
        layout === "rail" && "w-[44vw] max-w-[190px] shrink-0 xs:w-[150px] sm:w-[170px]",
        className,
      )}
    >
      <Link
        href={item.href}
        className="block rounded-lg focus-visible:outline-none"
        aria-label={`${item.title}${item.year ? ` (${item.year})` : ""} details`}
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border border-white/5 bg-ink-700 shadow-card transition-all duration-300 group-hover/card:-translate-y-1 group-hover/card:border-brand/40 group-hover/card:shadow-glow">
          {poster ? (
            <Image
              src={poster}
              alt={`${item.title} poster`}
              fill
              priority={priority}
              sizes={SIZES[layout]}
              className="object-cover transition-transform duration-500 group-hover/card:scale-[1.06]"
            />
          ) : (
            /* Missing artwork is common on TMDB; never show a broken image. */
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-ink-600 to-ink-900 p-3 text-center">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-mist-500">
                No poster
              </span>
              <span className="line-clamp-3 text-xs text-mist-300">{item.title}</span>
            </div>
          )}

          {/* Hover scrim + quick actions */}
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-end gap-2 bg-gradient-to-t from-black/85 via-black/25 to-transparent p-2.5 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100">
            <span className="btn-primary w-full !px-2 !py-1.5 text-xs">
              <PlayIcon width={13} height={13} />
              Details
            </span>
          </div>

          <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-mist-300 backdrop-blur">
            {TYPE_LABEL[item.mediaType]}
          </span>
          <RatingBadge vote={item.voteAverage} className="absolute right-1.5 top-1.5" />
        </div>

        <h3 className="mt-2 line-clamp-1 text-sm font-medium text-mist-100 transition-colors group-hover/card:text-white">
          {item.title}
        </h3>
        <p className="mt-0.5 text-xs text-mist-500">{item.year || "Release TBA"}</p>
      </Link>
    </article>
  );
}

export default MovieCard;
