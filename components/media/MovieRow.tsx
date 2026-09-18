"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";

import { AdMovieCard } from "@/components/media/AdMovieCard";
import { MovieCard } from "@/components/media/MovieCard";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/utils/cn";
import type { MediaItem } from "@/types/media";

interface MovieRowProps {
  title: string;
  items: MediaItem[];
  /** Optional "See all" target (e.g. a genre page). */
  href?: string;
  /** Row id, used as the scroll container's accessible name anchor. */
  id?: string;
  priority?: boolean;
  className?: string;
  /**
   * Insert one occasional ad card into this row (see AdMovieCard). Intended
   * for a single row on the page, not every row — keep this off elsewhere.
   * The ad is always an addition, never a replacement: no movie is removed
   * to make room for it, and renders as nothing if unconfigured.
   */
  showAd?: boolean;
}

/**
 * Horizontal poster rail with keyboard-reachable arrow controls.
 * Arrows are hidden on touch layouts, where native swiping is better.
 */
export function MovieRow({
  title,
  items,
  href,
  id,
  priority = false,
  className,
  showAd = false,
}: MovieRowProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const max = rail.scrollWidth - rail.clientWidth;
    setAtStart(rail.scrollLeft <= 8);
    setAtEnd(max <= 8 || rail.scrollLeft >= max - 8);
  }, []);

  useEffect(() => {
    sync();
    const rail = railRef.current;
    if (!rail) return;
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [sync, items.length]);

  const scrollBy = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * rail.clientWidth * 0.85, behavior: "smooth" });
  };

  if (items.length === 0) return null;

  const headingId = `row-${id ?? title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <section className={cn("container-page py-4 sm:py-5", className)} aria-labelledby={headingId}>
      <div className="mb-2.5 flex items-end justify-between gap-4">
        <h2 id={headingId} className="section-title">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {href ? (
            <Link
              href={href}
              className="text-xs font-semibold text-mist-500 transition-colors hover:text-brand-hover"
            >
              See all
            </Link>
          ) : null}
          <div className="hidden items-center gap-1.5 md:flex">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              disabled={atStart}
              aria-label={`Scroll ${title} left`}
              className="rounded-full border border-white/10 bg-ink-800/80 p-1.5 text-mist-300 transition-all hover:border-brand/50 hover:text-mist-100 disabled:opacity-30"
            >
              <ChevronLeftIcon width={16} height={16} />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              disabled={atEnd}
              aria-label={`Scroll ${title} right`}
              className="rounded-full border border-white/10 bg-ink-800/80 p-1.5 text-mist-300 transition-all hover:border-brand/50 hover:text-mist-100 disabled:opacity-30"
            >
              <ChevronRightIcon width={16} height={16} />
            </button>
          </div>
        </div>
      </div>

      <div ref={railRef} onScroll={sync} className="rail" tabIndex={0} role="group" aria-label={title}>
        {items.map((item, index) => (
          <Fragment key={`${item.mediaType}-${item.id}`}>
            <MovieCard
              item={item}
              // Only the leading cards can be above the fold; preloading a whole
              // screen of posters competes with the hero for bandwidth.
              priority={priority && index < 3}
            />
            {showAd && index === Math.min(2, items.length - 1) ? <AdMovieCard /> : null}
          </Fragment>
        ))}
      </div>
    </section>
  );
}

export default MovieRow;
