import { MovieCard } from "@/components/media/MovieCard";
import { cn } from "@/lib/utils/cn";
import type { MediaItem } from "@/types/media";

interface MediaGridProps {
  items: MediaItem[];
  /** Number of leading cards to prioritize for LCP. */
  priorityCount?: number;
  className?: string;
}

/** Responsive poster grid: 2 columns on phones up to 7 on wide desktops. */
export function MediaGrid({ items, priorityCount = 0, className }: MediaGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 xs:grid-cols-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6 xl:grid-cols-7",
        className,
      )}
    >
      {items.map((item, index) => (
        <MovieCard
          key={`${item.mediaType}-${item.id}`}
          item={item}
          layout="grid"
          priority={index < priorityCount}
        />
      ))}
    </div>
  );
}

export default MediaGrid;
