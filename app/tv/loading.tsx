import { GridSkeleton } from "@/components/ui/LoadingSkeleton";

/** Browse skeleton for /tv, matching /movies. */
export default function TVLoading() {
  return (
    <div className="page-shell">
      <div className="mb-6 space-y-3" aria-hidden="true">
        <div className="skeleton h-8 w-44 rounded" />
        <div className="skeleton h-3 w-72 max-w-full rounded" />
      </div>
      <GridSkeleton count={14} />
    </div>
  );
}
