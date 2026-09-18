import Link from "next/link";

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/Icons";
import { episodeLabel } from "@/lib/utils/format";

export interface EpisodeRef {
  season: number;
  episode: number;
  title?: string;
}

interface EpisodeNavProps {
  tvId: number;
  previous: EpisodeRef | null;
  next: EpisodeRef | null;
}

/**
 * Previous / next episode controls. Both walk across season boundaries, so the
 * last episode of a season links to the first episode of the next one.
 */
export function EpisodeNav({ tvId, previous, next }: EpisodeNavProps) {
  if (!previous && !next) return null;

  return (
    <nav
      aria-label="Episode navigation"
      className="flex flex-wrap items-center justify-between gap-2"
    >
      {previous ? (
        <Link
          href={`/watch/tv/${tvId}/${previous.season}/${previous.episode}`}
          className="btn-secondary"
          rel="prev"
        >
          <ChevronLeftIcon width={16} height={16} />
          <span className="truncate">
            Previous · {episodeLabel(previous.season, previous.episode)}
          </span>
        </Link>
      ) : (
        <span />
      )}

      {next ? (
        <Link
          href={`/watch/tv/${tvId}/${next.season}/${next.episode}`}
          className="btn-primary"
          rel="next"
        >
          <span className="truncate">
            Next · {episodeLabel(next.season, next.episode)}
          </span>
          <ChevronRightIcon width={16} height={16} />
        </Link>
      ) : null}
    </nav>
  );
}

export default EpisodeNav;
