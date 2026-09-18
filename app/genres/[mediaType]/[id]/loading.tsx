import { GridSkeleton } from "@/components/ui/LoadingSkeleton";

/** Genre page skeleton. */
export default function GenreLoading() {
  return (
    <div className="page-shell">
      <div className="mb-6 space-y-3" aria-hidden="true">
        <div className="skeleton h-8 w-56 rounded" />
        <div className="skeleton h-3 w-64 max-w-full rounded" />
      </div>
      <GridSkeleton count={14} />
    </div>
  );
}
