import { HeroSkeleton, RowSkeleton } from "@/components/ui/LoadingSkeleton";

/** Homepage skeleton: mirrors the hero + rails so nothing jumps on hydration. */
export default function HomeLoading() {
  return (
    <>
      <HeroSkeleton />
      <div className="-mt-6">
        <RowSkeleton />
        <RowSkeleton />
        <RowSkeleton />
      </div>
    </>
  );
}
