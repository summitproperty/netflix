import { GridSkeleton } from "@/components/ui/LoadingSkeleton";

/**
 * My List skeleton. This route hits Supabase for the session and the saved
 * rows, so the wait is real even on a fast connection.
 */
export default function MyListLoading() {
  return (
    <div className="page-shell">
      <div className="mb-6 space-y-3" aria-hidden="true">
        <div className="skeleton h-8 w-36 rounded" />
        <div className="skeleton h-3 w-64 max-w-full rounded" />
      </div>
      <GridSkeleton count={12} />
    </div>
  );
}
