import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdPlaceholder } from "@/components/ads/AdPlaceholder";
import { MovieRow } from "@/components/media/MovieRow";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { WatchBar } from "@/components/video/WatchBar";
import { requireUser } from "@/lib/auth/session";
import { getViewerListKeys, hasListKey } from "@/lib/mylist/keys";
import { isNotFound, logError } from "@/lib/utils/errors";
import { getVideoSource } from "@/lib/video/providers";
import { requireDetails } from "@/services/media.service";
import type { MediaDetail } from "@/types/media";

/*
 * /watch/movie/[tmdbId]
 *
 * Watching requires an account (browsing does not). Playback is a third-party
 * embed produced by the configured video provider — nothing is downloaded,
 * mirrored or re-served here.
 */

interface RouteParams {
  tmdbId: string;
}

async function loadMovie(rawId: string): Promise<MediaDetail | null> {
  try {
    return await requireDetails("movie", rawId);
  } catch (error) {
    if (isNotFound(error)) return null;
    logError("watch/movie", error);
    throw error;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { tmdbId } = await params;
  const detail = await loadMovie(tmdbId).catch(() => null);

  return {
    title: detail ? `Watch ${detail.title}` : "Watch",
    description: detail
      ? `Stream ${detail.title} on demand.`
      : "Stream movies and TV shows on demand.",
    robots: { index: false, follow: false },
  };
}

export default async function WatchMoviePage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { tmdbId } = await params;

  // Outside any try/catch: requireUser() throws Next's redirect signal.
  await requireUser(`/watch/movie/${tmdbId}`);

  const [detail, listKeys] = await Promise.all([
    loadMovie(tmdbId),
    getViewerListKeys(),
  ]);
  if (!detail) notFound();

  const source = getVideoSource({ mediaType: "movie", tmdbId: detail.id });
  const related = [...detail.recommendations, ...detail.similar].slice(0, 20);

  return (
    <div className="page-shell">
      <WatchBar
        item={detail}
        heading={detail.title}
        runtimeMinutes={detail.runtimeMinutes}
        inMyList={hasListKey(listKeys, "movie", detail.id)}
      />

      <VideoPlayer
        source={source}
        title={detail.title}
        runtimeMinutes={detail.runtimeMinutes}
        progressKey={{ mediaType: "movie", tmdbId: detail.id }}
      />

      {/*
        Reserved display slot, below the player and outside its frame — never
        over it. Renders nothing until NEXT_PUBLIC_AD_ZONE_WATCH_BELOW_PLAYER
        is set, so playback is never pushed down on a stock deployment.
      */}
      <AdPlaceholder zone="watch-below-player" />

      {detail.overview ? (
        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-mist-300">
          {detail.overview}
        </p>
      ) : null}

      {related.length > 0 ? (
        <div className="mt-8">
          <MovieRow
            id={`watch-related-${detail.id}`}
            title="More like this"
            items={related}
            className="!px-0"
          />
        </div>
      ) : null}
    </div>
  );
}
