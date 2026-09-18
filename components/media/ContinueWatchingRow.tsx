import { MovieRow } from "@/components/media/MovieRow";
import type { MediaItem } from "@/types/media";

interface ContinueWatchingRowProps {
  items: MediaItem[];
}

/**
 * Thin wrapper around the existing MovieRow — no new rail/grid implementation.
 * Renders nothing when there is nothing to show, same as every other
 * optional section on the dashboard.
 */
export function ContinueWatchingRow({ items }: ContinueWatchingRowProps) {
  if (items.length === 0) return null;

  return (
    <div className="mt-8">
      <MovieRow id="continue-watching" title="Continue Watching" items={items} />
    </div>
  );
}

export default ContinueWatchingRow;
