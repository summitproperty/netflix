import Image from "next/image";
import Link from "next/link";

import { MyListButton } from "@/components/mylist/MyListButton";
import { RatingButtons } from "@/components/ratings/RatingButtons";
import { PlayIcon } from "@/components/ui/Icons";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { backdropUrl, posterUrl } from "@/lib/tmdb/images";
import { formatDate, formatRuntime } from "@/lib/utils/format";
import type { MediaDetail } from "@/types/media";

interface MediaDetailsProps {
  detail: MediaDetail;
  inMyList?: boolean;
  /** The signed-in viewer's like/dislike, if any. */
  userRating?: 1 | -1 | null;
  /** Overrides the Watch Now target (TV points at a specific episode). */
  watchHref?: string;
  watchLabel?: string;
  /** Extra meta chips rendered after runtime (seasons, networks, ...). */
  extraMeta?: string[];
  children?: React.ReactNode;
}

/**
 * Shared detail header for movies and TV shows: backdrop, poster, metadata and
 * the primary actions. MovieDetails/TVDetails compose this with their own extras
 * so the two pages stay visually identical.
 */
export function MediaDetails({
  detail,
  inMyList = false,
  userRating = null,
  watchHref,
  watchLabel = "Watch Now",
  extraMeta = [],
  children,
}: MediaDetailsProps) {
  const backdrop = backdropUrl(detail.backdropPath, "w1280");
  const poster = posterUrl(detail.posterPath, "w500");
  const runtime = formatRuntime(detail.runtimeMinutes);
  const directors = detail.crew
    .filter((member) => member.job === "Director")
    .map((member) => member.name);
  const writers = detail.crew
    .filter((member) => member.job === "Writer" || member.job === "Screenplay")
    .map((member) => member.name);

  const meta = [
    detail.year || null,
    runtime || null,
    detail.certification || null,
    ...extraMeta,
  ].filter((value): value is string => Boolean(value));

  return (
    <article>
      {/* Backdrop band */}
      <div className="relative h-[42vh] min-h-[260px] w-full overflow-hidden sm:h-[54vh]">
        {backdrop ? (
          <Image
            src={backdrop}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-top"
          />
        ) : (
          <div className="absolute inset-0 bg-brand-sheen opacity-25" />
        )}
        <div className="absolute inset-0 bg-hero-fade" />
      </div>

      <div className="container-page relative -mt-28 pb-10 sm:-mt-36">
        <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
          <div className="relative aspect-[2/3] w-36 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-ink-700 shadow-card sm:w-56">
            {poster ? (
              <Image
                src={poster}
                alt={`${detail.title} poster`}
                fill
                // No `priority` here: the backdrop above is the LCP element and
                // preloading both makes them compete. The poster is in the
                // initial viewport, so the browser still requests it at once.
                sizes="(max-width: 640px) 144px, 224px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center p-3 text-center text-xs text-mist-500">
                No poster available
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 pt-1 sm:pt-16">
            <h1 className="text-balance text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
              {detail.title}
            </h1>
            {detail.tagline ? (
              <p className="mt-1.5 text-sm italic text-mist-500">{detail.tagline}</p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-mist-300">
              <RatingBadge vote={detail.voteAverage} voteCount={detail.voteCount} size="md" />
              {meta.map((value) => (
                <span key={value} className="text-mist-300">
                  {value}
                </span>
              ))}
            </div>

            {detail.genres.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {detail.genres.map((genre) => (
                  <Link
                    key={genre.id}
                    href={`/genres/${detail.mediaType}/${genre.id}`}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-mist-300 transition-colors hover:border-brand/50 hover:text-mist-100"
                  >
                    {genre.name}
                  </Link>
                ))}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link href={watchHref ?? detail.watchHref} className="btn-primary">
                <PlayIcon width={16} height={16} />
                {watchLabel}
              </Link>
              <MyListButton item={detail} initialInList={inMyList} />
              <RatingButtons
                mediaType={detail.mediaType}
                tmdbId={detail.id}
                detailPath={detail.href}
                initialRating={userRating}
              />
              {detail.trailerKey ? (
                <a
                  href={`https://www.youtube.com/watch?v=${detail.trailerKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost"
                >
                  Watch trailer
                </a>
              ) : null}
            </div>

            <div className="mt-6 space-y-4">
              <section>
                <h2 className="mb-1.5 text-sm font-semibold uppercase tracking-wider text-mist-500">
                  Overview
                </h2>
                <p className="max-w-3xl text-sm leading-relaxed text-mist-300">
                  {detail.overview || "No overview has been published for this title yet."}
                </p>
              </section>

              <dl className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                <Fact label="Release date" value={formatDate(detail.releaseDate)} />
                {detail.status ? <Fact label="Status" value={detail.status} /> : null}
                {directors.length > 0 ? (
                  <Fact label="Director" value={directors.slice(0, 3).join(", ")} />
                ) : null}
                {writers.length > 0 ? (
                  <Fact label="Writers" value={writers.slice(0, 3).join(", ")} />
                ) : null}
                {detail.createdBy.length > 0 ? (
                  <Fact label="Created by" value={detail.createdBy.slice(0, 3).join(", ")} />
                ) : null}
                {detail.networks.length > 0 ? (
                  <Fact
                    // Movies carry production companies in this field, shows
                    // carry broadcast networks — label it for what it holds.
                    label={detail.mediaType === "tv" ? "Network" : "Studio"}
                    value={detail.networks.slice(0, 3).join(", ")}
                  />
                ) : null}
              </dl>
            </div>
          </div>
        </div>

        {children ? <div className="mt-10 space-y-10">{children}</div> : null}
      </div>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-mist-500">{label}:</dt>
      <dd className="min-w-0 text-mist-100">{value}</dd>
    </div>
  );
}

export default MediaDetails;
