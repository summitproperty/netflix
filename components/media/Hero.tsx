"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { MyListButton } from "@/components/mylist/MyListButton";
import { PlayIcon } from "@/components/ui/Icons";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { genreName } from "@/lib/tmdb/genres";
import { backdropUrl } from "@/lib/tmdb/images";
import { truncate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { MediaItem } from "@/types/media";

interface HeroProps {
  items: MediaItem[];
  /** "movie-123" keys already in the viewer's list. */
  myListKeys?: string[];
  /** Seconds between automatic slides; 0 disables rotation. */
  intervalSeconds?: number;
}

const TYPE_LABEL: Record<MediaItem["mediaType"], string> = {
  movie: "Movie",
  tv: "Series",
};

/**
 * Full-bleed cinematic hero. Rotates through the trending titles, pauses on
 * hover/focus, and never auto-rotates for visitors who prefer reduced motion.
 */
export function Hero({ items, myListKeys = [], intervalSeconds = 9 }: HeroProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length < 2 || paused || intervalSeconds <= 0) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % items.length),
      intervalSeconds * 1000,
    );
    return () => window.clearInterval(timer);
  }, [items.length, intervalSeconds, paused]);

  if (items.length === 0) return null;

  const active = items[Math.min(index, items.length - 1)];
  const backdrop = backdropUrl(active.backdropPath, "w1280");
  const genres = active.genreIds
    .map((id) => genreName(active.mediaType, id))
    .filter((name): name is string => Boolean(name))
    .slice(0, 3);

  return (
    <section
      className="relative isolate min-h-[460px] w-full overflow-hidden sm:h-[78vh] sm:max-h-[820px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured titles"
    >
      {backdrop ? (
        <Image
          key={backdrop}
          src={backdrop}
          alt=""
          fill
          priority
          sizes="100vw"
          className="animate-fade-in object-cover object-top"
        />
      ) : (
        <div className="absolute inset-0 bg-brand-sheen opacity-30" />
      )}

      {/* Gradient overlays keep the copy readable over any artwork */}
      <div className="absolute inset-0 bg-hero-fade" />
      <div className="absolute inset-0 bg-hero-side" />

      <div className="container-page relative flex h-full flex-col justify-end pb-10 pt-[calc(var(--nav-height)+3rem)] sm:pb-16">
        <div key={active.id} className="max-w-2xl animate-fade-up">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-mist-300">
            <span className="rounded bg-brand px-2 py-0.5 font-bold uppercase tracking-wider text-white">
              {TYPE_LABEL[active.mediaType]}
            </span>
            <RatingBadge vote={active.voteAverage} voteCount={active.voteCount} />
            {active.year ? <span>{active.year}</span> : null}
            {genres.length > 0 ? (
              <span className="text-mist-500">{genres.join(" · ")}</span>
            ) : null}
          </div>

          <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-tight text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.8)] sm:text-5xl lg:text-6xl">
            {active.title}
          </h1>

          {active.overview ? (
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-mist-300 sm:mt-4 sm:text-base">
              {truncate(active.overview, 240)}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link href={active.watchHref} className="btn-primary">
              <PlayIcon width={16} height={16} />
              Watch Now
            </Link>
            <MyListButton
              item={active}
              initialInList={myListKeys.includes(`${active.mediaType}-${active.id}`)}
            />
            <Link href={active.href} className="btn-ghost">
              More info
            </Link>
          </div>
        </div>

        {items.length > 1 ? (
          // Not a tablist: there are no tab panels here, only a slide picker.
          // `aria-current` marks the visible slide without promising tab
          // semantics (arrow-key panel navigation) that this widget lacks.
          <div
            className="mt-6 flex items-center gap-2"
            role="group"
            aria-label="Choose a featured title"
          >
            {items.map((item, dot) => (
              <button
                key={item.id}
                type="button"
                aria-current={dot === index ? "true" : undefined}
                aria-label={`Show ${item.title}`}
                onClick={() => setIndex(dot)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  dot === index
                    ? "w-7 bg-brand"
                    : "w-3 bg-white/25 hover:bg-white/50",
                )}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default Hero;
