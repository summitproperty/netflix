import { cn } from "@/lib/utils/cn";

/**
 * Skeleton placeholders that mirror the real layouts, so nothing shifts when
 * data arrives. Used by route-level loading.tsx files and Suspense fallbacks.
 */

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("w-[44vw] max-w-[190px] shrink-0 xs:w-[150px] sm:w-[170px]", className)}>
      <div className="skeleton aspect-[2/3] w-full rounded-lg" />
      <div className="skeleton mt-2 h-3 w-4/5 rounded" />
      <div className="skeleton mt-1.5 h-2.5 w-2/5 rounded" />
    </div>
  );
}

export function RowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <section className="container-page py-4" aria-hidden="true">
      <div className="skeleton mb-3 h-5 w-40 rounded" />
      <div className="flex gap-3 overflow-hidden sm:gap-4">
        {Array.from({ length: count }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}

export function HeroSkeleton() {
  return (
    // Geometry mirrors components/media/Hero.tsx exactly, otherwise the page
    // jumps when the real hero replaces this.
    <div
      className="relative min-h-[460px] w-full overflow-hidden bg-ink-800 sm:h-[78vh] sm:max-h-[820px]"
      aria-hidden="true"
    >
      <div className="skeleton absolute inset-0" />
      <div className="container-page absolute bottom-10 left-0 right-0 space-y-4 sm:bottom-16">
        <div className="skeleton h-5 w-52 rounded" />
        <div className="skeleton h-10 w-3/4 max-w-xl rounded" />
        <div className="skeleton h-3 w-full max-w-xl rounded" />
        <div className="skeleton h-3 w-4/5 max-w-xl rounded" />
        <div className="flex gap-3 pt-2">
          <div className="skeleton h-11 w-36 rounded-lg" />
          <div className="skeleton h-11 w-40 rounded-lg" />
          <div className="skeleton h-11 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 18 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-3 xs:grid-cols-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6 xl:grid-cols-7"
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          <div className="skeleton aspect-[2/3] w-full rounded-lg" />
          <div className="skeleton mt-2 h-3 w-4/5 rounded" />
          <div className="skeleton mt-1.5 h-2.5 w-2/5 rounded" />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    // Backdrop band, negative pull and poster width all match
    // components/media/MediaDetails.tsx so the swap is invisible.
    <div aria-hidden="true">
      <div className="skeleton h-[42vh] min-h-[260px] w-full sm:h-[54vh]" />
      <div className="container-page relative -mt-28 flex flex-col gap-6 pb-10 sm:-mt-36 sm:flex-row sm:gap-8">
        <div className="skeleton aspect-[2/3] w-36 shrink-0 rounded-xl sm:w-56" />
        <div className="flex-1 space-y-3 pt-1 sm:pt-16">
          <div className="skeleton h-8 w-2/3 rounded" />
          <div className="skeleton h-3 w-48 rounded" />
          <div className="skeleton h-6 w-64 rounded-full" />
          <div className="flex gap-3 pt-2">
            <div className="skeleton h-11 w-36 rounded-lg" />
            <div className="skeleton h-11 w-40 rounded-lg" />
          </div>
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-3 w-11/12 rounded" />
          <div className="skeleton h-3 w-3/4 rounded" />
        </div>
      </div>
    </div>
  );
}

export function PlayerSkeleton() {
  return (
    <div className="skeleton aspect-video w-full rounded-xl" aria-hidden="true" />
  );
}

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn("skeleton h-3 rounded", index === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}
