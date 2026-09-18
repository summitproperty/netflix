import { PlayerSkeleton, TextSkeleton } from "@/components/ui/LoadingSkeleton";

export default function WatchEpisodeLoading() {
  return (
    <div className="page-shell">
      <div className="mb-4 space-y-2">
        <div className="skeleton h-3 w-32 rounded" aria-hidden="true" />
        <div className="skeleton h-7 w-2/3 max-w-md rounded" aria-hidden="true" />
        <div className="skeleton h-3 w-52 rounded" aria-hidden="true" />
      </div>

      <PlayerSkeleton />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="skeleton h-9 w-40 rounded-lg" aria-hidden="true" />
        <div className="skeleton h-9 w-40 rounded-lg" aria-hidden="true" />
      </div>

      <div className="mt-5 max-w-3xl">
        <TextSkeleton lines={3} />
      </div>
    </div>
  );
}
