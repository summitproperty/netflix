import { GridSkeleton } from "@/components/ui/LoadingSkeleton";

/**
 * Search skeleton. The search page reads `?q=` on the server, so navigating
 * between queries suspends: this keeps the shell steady instead of blanking.
 */
export default function SearchLoading() {
  return (
    <div className="page-shell">
      <div className="mb-6 space-y-3" aria-hidden="true">
        <div className="skeleton h-8 w-44 rounded" />
        <div className="skeleton h-11 w-full max-w-xl rounded-lg" />
        <div className="skeleton h-3 w-56 rounded" />
      </div>
      <GridSkeleton count={14} />
    </div>
  );
}
