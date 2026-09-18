import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TVDetails } from "@/components/media/TVDetails";
import { backdropUrl, posterUrl } from "@/lib/tmdb/images";
import { isNotFound, logError } from "@/lib/utils/errors";
import { getViewerListKeys, hasListKey } from "@/lib/mylist/keys";
import { getViewerRating } from "@/lib/ratings/viewer";
import { getSeasonSafe, requireDetails } from "@/services/media.service";
import type { MediaDetail } from "@/types/media";

/*
 * /tv/[tmdbId]
 *
 * Same shape as the movie route, plus a pre-fetched first season so the episode
 * list renders on the server and does not flash a skeleton on first paint.
 */

interface RouteParams {
  tmdbId: string;
}

async function loadShow(rawId: string): Promise<MediaDetail | null> {
  try {
    return await requireDetails("tv", rawId);
  } catch (error) {
    if (isNotFound(error)) return null;
    logError("tv/detail", error);
    throw error;
  }
}

/** Season 0 is usually specials, so default to the first numbered season. */
function firstRealSeason(detail: MediaDetail): number {
  const numbered = detail.seasons.filter((season) => season.seasonNumber > 0);
  return numbered[0]?.seasonNumber ?? detail.seasons[0]?.seasonNumber ?? 1;
}

export const revalidate = 21600;

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { tmdbId } = await params;
  const detail = await loadShow(tmdbId).catch(() => null);

  if (!detail) {
    return { title: "Series not found", robots: { index: false, follow: false } };
  }

  const description =
    detail.overview.slice(0, 300) ||
    `Watch ${detail.title} — seasons, episodes, cast and ratings.`;
  const image =
    backdropUrl(detail.backdropPath, "w1280") ?? posterUrl(detail.posterPath, "w500");

  return {
    title: detail.year ? `${detail.title} (${detail.year})` : detail.title,
    description,
    alternates: { canonical: `/tv/${detail.id}` },
    openGraph: {
      type: "video.tv_show",
      title: detail.title,
      description,
      url: `/tv/${detail.id}`,
      images: image
        ? [{ url: image, width: 1280, height: 720, alt: detail.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: detail.title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function TVDetailPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { tmdbId } = await params;
  const [detail, listKeys] = await Promise.all([
    loadShow(tmdbId),
    getViewerListKeys(),
  ]);

  if (!detail) notFound();

  const [initialSeason, userRating] = await Promise.all([
    getSeasonSafe(detail.id, firstRealSeason(detail)),
    getViewerRating("tv", detail.id),
  ]);

  return (
    <TVDetails
      detail={detail}
      initialSeason={initialSeason}
      inMyList={hasListKey(listKeys, "tv", detail.id)}
      userRating={userRating}
    />
  );
}
