import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdPlaceholder } from "@/components/ads/AdPlaceholder";
import { InfiniteMediaGrid } from "@/components/media/InfiniteMediaGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilmIcon } from "@/components/ui/Icons";
import { genreName } from "@/lib/tmdb/genres";
import { discover, getGenres } from "@/services/media.service";
import type { MediaType } from "@/types/media";

/*
 * /genres/[mediaType]/[id] — a full discover feed for one genre. mediaType is
 * validated against "movie" | "tv" and the id must be a positive integer, so a
 * hand-typed URL degrades into a proper 404 rather than a TMDB error.
 */

interface RouteParams {
  mediaType: string;
  id: string;
}

async function resolve(params: RouteParams) {
  const mediaType: MediaType | null =
    params.mediaType === "movie" || params.mediaType === "tv"
      ? params.mediaType
      : null;
  const id = Number(params.id);
  if (!mediaType || !Number.isInteger(id) || id <= 0) return null;

  // Prefer the live TMDB name; fall back to the bundled table when offline.
  const live = await getGenres(mediaType);
  const name =
    live.find((genre) => genre.id === id)?.name ?? genreName(mediaType, id) ?? null;

  return { mediaType, id, name };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const resolved = await resolve(await params);
  if (!resolved || !resolved.name) {
    return { title: "Genre not found" };
  }

  const label = resolved.mediaType === "movie" ? "movies" : "TV shows";
  const title = `${resolved.name} ${label}`;

  return {
    title,
    description: `Browse ${resolved.name.toLowerCase()} ${label} with ratings, cast and instant streaming.`,
    alternates: {
      canonical: `/genres/${resolved.mediaType}/${resolved.id}`,
    },
  };
}

export const revalidate = 3600;

export default async function GenrePage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const resolved = await resolve(await params);
  if (!resolved) notFound();

  const { mediaType, id, name } = resolved;
  const initial = await discover(mediaType, { genreId: id, page: 1 });

  // An unknown id that TMDB also has no results for is a dead URL.
  if (!name && initial.items.length === 0) notFound();

  const kind = mediaType === "movie" ? "Movies" : "TV Shows";
  const heading = name ? `${name} ${kind}` : kind;

  return (
    <div className="page-shell">
      <PageHeader
        title={heading}
        description={
          name
            ? `Everything in ${name.toLowerCase()}, sorted by popularity.`
            : "Sorted by popularity."
        }
      />

      {initial.items.length === 0 ? (
        <EmptyState
          title="Nothing in this genre yet"
          message="There are no titles in this genre right now. Try another genre, or browse the full catalog."
          icon={<FilmIcon width={22} height={22} />}
          action={{ href: "/genres", label: "All genres" }}
        />
      ) : (
        <InfiniteMediaGrid
          initial={initial}
          mediaType={mediaType}
          sort="popular"
          genreId={id}
        />
      )}

      {/* Reserved display slot, after the grid. Empty unless configured. */}
      <AdPlaceholder zone="list-footer" />
    </div>
  );
}
