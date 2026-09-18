import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AdPlaceholder } from "@/components/ads/AdPlaceholder";
import { SeasonEpisodes } from "@/components/media/SeasonEpisodes";
import { EpisodeNav, type EpisodeRef } from "@/components/video/EpisodeNav";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { WatchBar } from "@/components/video/WatchBar";
import { requireUser } from "@/lib/auth/session";
import { getViewerListKeys, hasListKey } from "@/lib/mylist/keys";
import { isNotFound, logError } from "@/lib/utils/errors";
import { episodeLabel } from "@/lib/utils/format";
import { getVideoSource } from "@/lib/video/providers";
import { getSeasonSafe, requireDetails } from "@/services/media.service";
import type {
  EpisodeItem,
  MediaDetail,
  SeasonDetail,
  SeasonSummary,
} from "@/types/media";

/*
 * /watch/tv/[tmdbId]/[season]/[episode]
 *
 * Watching requires an account (browsing does not). Playback is a third-party
 * embed produced by the configured video provider — nothing is downloaded,
 * mirrored or re-served here.
 */

interface RouteParams {
  tmdbId: string;
  season: string;
  episode: string;
}

interface Resolved {
  tmdbId: string;
  season: number;
  episode: number;
}

/** Parse the URL segments; anything non-numeric is a 404, not an error. */
function parseParams(params: RouteParams): Resolved | null {
  const season = Number(params.season);
  const episode = Number(params.episode);

  if (!Number.isInteger(season) || season < 0) return null;
  if (!Number.isInteger(episode) || episode < 1) return null;

  return { tmdbId: params.tmdbId, season, episode };
}

async function loadShow(rawId: string): Promise<MediaDetail | null> {
  try {
    return await requireDetails("tv", rawId);
  } catch (error) {
    if (isNotFound(error)) return null;
    logError("watch/tv", error);
    throw error;
  }
}

/**
 * Previous / next episode, walking across season boundaries: episode 1 of a
 * season links back to the finale of the season before it.
 *
 * Specials (season 0) are deliberately left out of the ordered sequence so a
 * viewer is never dropped into them from a regular season; navigation inside
 * season 0 still works because the current season is always considered.
 */
function buildNeighbours(
  seasons: SeasonSummary[],
  currentSeason: number,
  currentEpisode: number,
  fetched: SeasonDetail | null,
): { previous: EpisodeRef | null; next: EpisodeRef | null } {
  const ordered = seasons
    .filter((season) => season.seasonNumber > 0 && season.episodeCount > 0)
    .sort((a, b) => a.seasonNumber - b.seasonNumber);

  const index = ordered.findIndex(
    (season) => season.seasonNumber === currentSeason,
  );

  // Prefer the real episode list; fall back to TMDB's summary count.
  const listed = fetched?.episodes.length ?? 0;
  const summarised =
    ordered.find((season) => season.seasonNumber === currentSeason)
      ?.episodeCount ?? 0;
  const lastInSeason = Math.max(listed, summarised, currentEpisode);

  const titleFor = (episode: number): string | undefined =>
    fetched?.episodes.find((item) => item.episodeNumber === episode)?.name;

  let previous: EpisodeRef | null = null;
  if (currentEpisode > 1) {
    previous = {
      season: currentSeason,
      episode: currentEpisode - 1,
      title: titleFor(currentEpisode - 1),
    };
  } else if (index > 0) {
    const before = ordered[index - 1];
    previous = {
      season: before.seasonNumber,
      episode: Math.max(before.episodeCount, 1),
    };
  }

  let next: EpisodeRef | null = null;
  if (currentEpisode < lastInSeason) {
    next = {
      season: currentSeason,
      episode: currentEpisode + 1,
      title: titleFor(currentEpisode + 1),
    };
  } else if (index >= 0 && index < ordered.length - 1) {
    next = { season: ordered[index + 1].seasonNumber, episode: 1 };
  }

  return { previous, next };
}

function findEpisode(
  season: SeasonDetail | null,
  episodeNumber: number,
): EpisodeItem | null {
  return (
    season?.episodes.find((item) => item.episodeNumber === episodeNumber) ?? null
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const resolved = parseParams(await params);
  const detail = resolved ? await loadShow(resolved.tmdbId).catch(() => null) : null;

  const label = resolved ? episodeLabel(resolved.season, resolved.episode) : "";
  const title = detail ? `Watch ${detail.title} · ${label}` : "Watch";

  return {
    title,
    description: detail
      ? `Stream ${detail.title} ${label} on demand.`
      : "Stream movies and TV shows on demand.",
    robots: { index: false, follow: false },
  };
}

export default async function WatchEpisodePage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const raw = await params;

  // Outside any try/catch: requireUser() throws Next's redirect signal.
  await requireUser(
    `/watch/tv/${raw.tmdbId}/${raw.season}/${raw.episode}`,
  );

  const resolved = parseParams(raw);
  if (!resolved) notFound();

  const [detail, listKeys] = await Promise.all([
    loadShow(resolved.tmdbId),
    getViewerListKeys(),
  ]);
  if (!detail) notFound();

  // A show with a season list that does not contain this season is a bad URL —
  // with one exception. Cards in rails, search results and My List cannot know a
  // show's season numbering (TMDB's list endpoints omit `seasons`), so they all
  // link to the canonical S1 E1. Shows whose first real season is not 1 are
  // forwarded to their actual first playable episode instead of 404ing.
  const known =
    detail.seasons.length === 0 ||
    detail.seasons.some((season) => season.seasonNumber === resolved.season);

  if (!known) {
    const firstPlayable =
      detail.seasons.length > 0
        ? Math.min(...detail.seasons.map((season) => season.seasonNumber))
        : null;
    if (resolved.season === 1 && resolved.episode === 1 && firstPlayable !== null) {
      // Outside any try/catch: redirect() throws Next's redirect signal.
      redirect(`/watch/tv/${detail.id}/${firstPlayable}/1`);
    }
    notFound();
  }

  const season = await getSeasonSafe(detail.id, resolved.season);
  // Only reject the episode when we actually have a list to check against, so a
  // TMDB hiccup degrades to "play it anyway" rather than a false 404.
  if (season && season.episodes.length > 0) {
    if (!findEpisode(season, resolved.episode)) notFound();
  }

  const episode = findEpisode(season, resolved.episode);
  const label = episodeLabel(resolved.season, resolved.episode);
  const subheading = episode ? `${label} · ${episode.name}` : label;

  const source = getVideoSource({
    mediaType: "tv",
    tmdbId: detail.id,
    season: resolved.season,
    episode: resolved.episode,
  });

  const { previous, next } = buildNeighbours(
    detail.seasons,
    resolved.season,
    resolved.episode,
    season,
  );

  return (
    <div className="page-shell">
      <WatchBar
        item={detail}
        heading={detail.title}
        subheading={subheading}
        runtimeMinutes={episode?.runtimeMinutes ?? detail.runtimeMinutes}
        inMyList={hasListKey(listKeys, "tv", detail.id)}
      />

      <VideoPlayer
        source={source}
        title={`${detail.title} ${label}`}
        runtimeMinutes={episode?.runtimeMinutes ?? detail.runtimeMinutes}
        subtitle={subheading}
        progressKey={{
          mediaType: "tv",
          tmdbId: detail.id,
          seasonNumber: resolved.season,
          episodeNumber: resolved.episode,
        }}
      />

      <div className="mt-4">
        <EpisodeNav tvId={detail.id} previous={previous} next={next} />
      </div>

      {/*
        Reserved display slot, below the player and the episode controls — never
        over them. Renders nothing until NEXT_PUBLIC_AD_ZONE_WATCH_BELOW_PLAYER
        is set, so playback is never pushed down on a stock deployment.
      */}
      <AdPlaceholder zone="watch-below-player" />

      {episode?.overview ? (
        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-mist-300">
          {episode.overview}
        </p>
      ) : null}

      {detail.seasons.length > 0 ? (
        <div className="mt-8">
          <SeasonEpisodes
            tvId={detail.id}
            seasons={detail.seasons}
            initialSeason={season}
          />
        </div>
      ) : null}
    </div>
  );
}
