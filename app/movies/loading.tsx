import { GridSkeleton } from "@/components/ui/LoadingSkeleton";

/** Browse skeleton: heading block + poster grid. */
export default function MoviesLoading() {
  return (
    <div className="page-shell">
      <div className="mb-6 space-y-3" aria-hidden="true">
        <div className="skeleton h-8 w-40 rounded" />
        <div className="skeleton h-3 w-72 max-w-full rounded" />
      </div>
      <GridSkeleton count={14} />
    </div>
  );
}
