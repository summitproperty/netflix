import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MovieDetails } from "@/components/media/MovieDetails";
import { backdropUrl, posterUrl } from "@/lib/tmdb/images";
import { isNotFound, logError } from "@/lib/utils/errors";
import { getViewerListKeys, hasListKey } from "@/lib/mylist/keys";
import { getViewerRating } from "@/lib/ratings/viewer";
import { requireDetails } from "@/services/media.service";
import type { MediaDetail } from "@/types/media";

/*
 * /movie/[tmdbId]
 *
 * Browsing is public — only the watch page is gated. An unknown or malformed id
 * resolves to the shared 404 page instead of an error boundary.
 */

interface RouteParams {
  tmdbId: string;
}

async function loadMovie(rawId: string): Promise<MediaDetail | null> {
  try {
    return await requireDetails("movie", rawId);
  } catch (error) {
    if (isNotFound(error)) return null;
    logError("movie/detail", error);
    throw error;
  }
}

export const revalidate = 21600;

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { tmdbId } = await params;
  const detail = await loadMovie(tmdbId).catch(() => null);

  if (!detail) {
    return { title: "Movie not found", robots: { index: false, follow: false } };
  }

  const description =
    detail.overview.slice(0, 300) ||
    `Watch ${detail.title} — cast, ratings, runtime and streaming details.`;
  const image = backdropUrl(detail.backdropPath, "w1280") ?? posterUrl(detail.posterPath, "w500");

  return {
    title: detail.year ? `${detail.title} (${detail.year})` : detail.title,
    description,
    alternates: { canonical: `/movie/${detail.id}` },
    openGraph: {
      type: "video.movie",
      title: detail.title,
      description,
      url: `/movie/${detail.id}`,
      images: image ? [{ url: image, width: 1280, height: 720, alt: detail.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: detail.title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function MoviePage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { tmdbId } = await params;
  const [detail, listKeys] = await Promise.all([
    loadMovie(tmdbId),
    getViewerListKeys(),
  ]);

  if (!detail) notFound();

  const userRating = await getViewerRating("movie", detail.id);

  return (
    <MovieDetails
      detail={detail}
      inMyList={hasListKey(listKeys, "movie", detail.id)}
      userRating={userRating}
    />
  );
}
