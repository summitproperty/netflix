import Link from "next/link";

import { MyListButton } from "@/components/mylist/MyListButton";
import { ChevronLeftIcon } from "@/components/ui/Icons";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { formatRuntime } from "@/lib/utils/format";
import type { MediaItem } from "@/types/media";

interface WatchBarProps {
  /** The title being watched, used for the My List button and the back link. */
  item: MediaItem;
  heading: string;
  /** e.g. "S02E04 · The Reckoning". */
  subheading?: string;
  runtimeMinutes?: number | null;
  inMyList?: boolean;
  backLabel?: string;
}

/** Title bar above the player: back link, name, quick facts, save control. */
export function WatchBar({
  item,
  heading,
  subheading,
  runtimeMinutes,
  inMyList = false,
  backLabel,
}: WatchBarProps) {
  const runtime = formatRuntime(runtimeMinutes);

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <Link
          href={item.href}
          className="inline-flex items-center gap-1 text-xs font-semibold text-mist-500 transition-colors hover:text-mist-100"
        >
          <ChevronLeftIcon width={14} height={14} />
          {backLabel ?? `Back to ${item.title}`}
        </Link>

        <h1 className="mt-1 truncate text-xl font-extrabold tracking-tight text-white sm:text-2xl">
          {heading}
        </h1>

        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-mist-500">
          <RatingBadge vote={item.voteAverage} size="sm" />
          {subheading ? <span className="text-mist-300">{subheading}</span> : null}
          {item.year ? <span>{item.year}</span> : null}
          {runtime ? <span>{runtime}</span> : null}
        </div>
      </div>

      <MyListButton item={item} initialInList={inMyList} variant="secondary" />
    </div>
  );
}

export default WatchBar;
