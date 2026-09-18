import type {
  CastMember,
  CrewMember,
  EpisodeItem,
  MediaDetail,
  MediaItem,
  PagedMedia,
  SeasonDetail,
  SeasonSummary,
} from "@/types/media";
import type {
  MediaType,
  TMDBCredits,
  TMDBEpisode,
  TMDBMovie,
  TMDBMovieDetails,
  TMDBMultiSearchResult,
  TMDBPaginated,
  TMDBSeasonDetails,
  TMDBSeasonSummary,
  TMDBTVDetails,
  TMDBTVShow,
  TMDBVideo,
} from "@/types/tmdb";
import { formatYear } from "@/lib/utils/format";

/**
 * TMDB -> app model normalizers. Pure and dependency-free, so both server
 * components and client components (consuming /api/tmdb) can use them.
 */

function isMovieLike(value: TMDBMultiSearchResult): value is TMDBMovie {
  return (value as TMDBMovie).title !== undefined;
}

function isTvLike(value: TMDBMultiSearchResult): value is TMDBTVShow {
  return (value as TMDBTVShow).name !== undefined;
}

export function normalizeMovie(movie: TMDBMovie): MediaItem {
  const releaseDate = movie.release_date ?? null;
  return {
    id: movie.id,
    mediaType: "movie",
    title: movie.title || movie.original_title || "Untitled",
    overview: movie.overview ?? "",
    posterPath: movie.poster_path ?? null,
    backdropPath: movie.backdrop_path ?? null,
    releaseDate,
    year: formatYear(releaseDate),
    voteAverage: movie.vote_average ?? 0,
    voteCount: movie.vote_count ?? 0,
    genreIds: movie.genre_ids ?? [],
    href: `/movie/${movie.id}`,
    watchHref: `/watch/movie/${movie.id}`,
  };
}

export function normalizeTV(show: TMDBTVShow): MediaItem {
  const releaseDate = show.first_air_date ?? null;
  return {
    id: show.id,
    mediaType: "tv",
    title: show.name || show.original_name || "Untitled",
    overview: show.overview ?? "",
    posterPath: show.poster_path ?? null,
    backdropPath: show.backdrop_path ?? null,
    releaseDate,
    year: formatYear(releaseDate),
    voteAverage: show.vote_average ?? 0,
    voteCount: show.vote_count ?? 0,
    genreIds: show.genre_ids ?? [],
    href: `/tv/${show.id}`,
    // List endpoints do not include a season list, so this is the canonical
    // entry point. /watch/tv/[id]/1/1 forwards to the show's real first season
    // when season 1 does not exist.
    watchHref: `/watch/tv/${show.id}/1/1`,
  };
}

/** Multi-search rows: people are dropped, they have no watchable page. */
export function normalizeMulti(result: TMDBMultiSearchResult): MediaItem | null {
  if (result.media_type === "person") return null;
  if (result.media_type === "movie" || (!result.media_type && isMovieLike(result))) {
    return normalizeMovie(result as TMDBMovie);
  }
  if (result.media_type === "tv" || (!result.media_type && isTvLike(result))) {
    return normalizeTV(result as TMDBTVShow);
  }
  return null;
}

export function normalizeItem(
  value: TMDBMovie | TMDBTVShow,
  mediaType: MediaType,
): MediaItem {
  return mediaType === "movie"
    ? normalizeMovie(value as TMDBMovie)
    : normalizeTV(value as TMDBTVShow);
}

/** Cards with no poster look broken in a rail, so they are filtered out. */
export function withPoster(items: MediaItem[]): MediaItem[] {
  return items.filter((item) => item.posterPath !== null);
}

export function dedupeById(items: MediaItem[]): MediaItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.mediaType}-${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function normalizePaged(
  payload: TMDBPaginated<TMDBMovie | TMDBTVShow> | null,
  mediaType: MediaType,
): PagedMedia {
  if (!payload) {
    return { page: 1, totalPages: 0, totalResults: 0, items: [] };
  }
  return {
    page: payload.page ?? 1,
    // TMDB hard-caps pagination at 500 pages.
    totalPages: Math.min(payload.total_pages ?? 0, 500),
    totalResults: payload.total_results ?? 0,
    items: dedupeById((payload.results ?? []).map((row) => normalizeItem(row, mediaType))),
  };
}

export function normalizeMultiPaged(
  payload: TMDBPaginated<TMDBMultiSearchResult> | null,
): PagedMedia {
  if (!payload) {
    return { page: 1, totalPages: 0, totalResults: 0, items: [] };
  }
  const items = (payload.results ?? [])
    .map(normalizeMulti)
    .filter((item): item is MediaItem => item !== null);
  return {
    page: payload.page ?? 1,
    totalPages: Math.min(payload.total_pages ?? 0, 500),
    totalResults: payload.total_results ?? 0,
    items: dedupeById(items),
  };
}

/* -------------------------------------------------------------------------- */
/*  Details                                                                    */
/* -------------------------------------------------------------------------- */

const IMPORTANT_JOBS = new Set([
  "Director",
  "Creator",
  "Screenplay",
  "Writer",
  "Story",
  "Producer",
  "Original Music Composer",
]);

function normalizeCast(credits: TMDBCredits | undefined, limit = 20): CastMember[] {
  return (credits?.cast ?? [])
    .slice(0, limit)
    .map((member) => ({
      id: member.id,
      name: member.name,
      role: member.character?.trim() || "Cast",
      profilePath: member.profile_path ?? null,
    }));
}

function normalizeCrew(credits: TMDBCredits | undefined, limit = 8): CrewMember[] {
  const crew = (credits?.crew ?? []).filter((member) =>
    IMPORTANT_JOBS.has(member.job ?? ""),
  );
  const seen = new Set<string>();
  const unique: CrewMember[] = [];
  for (const member of crew) {
    const key = `${member.id}-${member.job}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({
      id: member.id,
      name: member.name,
      job: member.job ?? "Crew",
      profilePath: member.profile_path ?? null,
    });
    if (unique.length >= limit) break;
  }
  return unique;
}

/** Prefer an official YouTube trailer, then any trailer, then any teaser. */
function pickTrailerKey(videos: TMDBVideo[] | undefined): string | null {
  if (!videos || videos.length === 0) return null;
  const youtube = videos.filter((video) => video.site === "YouTube");
  const ranked =
    youtube.find((video) => video.type === "Trailer" && video.official) ??
    youtube.find((video) => video.type === "Trailer") ??
    youtube.find((video) => video.type === "Teaser") ??
    youtube[0];
  return ranked?.key ?? null;
}

export function normalizeSeasonSummary(season: TMDBSeasonSummary): SeasonSummary {
  return {
    id: season.id,
    name: season.name,
    seasonNumber: season.season_number,
    episodeCount: season.episode_count ?? 0,
    airDate: season.air_date ?? null,
    overview: season.overview ?? "",
    posterPath: season.poster_path ?? null,
  };
}

export function normalizeEpisode(episode: TMDBEpisode): EpisodeItem {
  return {
    id: episode.id,
    name: episode.name || `Episode ${episode.episode_number}`,
    overview: episode.overview ?? "",
    seasonNumber: episode.season_number,
    episodeNumber: episode.episode_number,
    stillPath: episode.still_path ?? null,
    airDate: episode.air_date ?? null,
    runtimeMinutes: episode.runtime ?? null,
    voteAverage: episode.vote_average ?? 0,
  };
}

export function normalizeSeason(season: TMDBSeasonDetails): SeasonDetail {
  return {
    ...normalizeSeasonSummary(season),
    episodes: (season.episodes ?? []).map(normalizeEpisode),
  };
}

export function normalizeMovieDetails(details: TMDBMovieDetails): MediaDetail {
  const base = normalizeMovie(details);
  const usRelease = details.release_dates?.results?.find(
    (entry) => entry.iso_3166_1 === "US",
  );
  const certification =
    usRelease?.release_dates?.find((entry) => entry.certification?.trim())
      ?.certification ?? "";

  return {
    ...base,
    tagline: details.tagline?.trim() ?? "",
    genres: details.genres ?? [],
    runtimeMinutes: details.runtime ?? null,
    status: details.status ?? "",
    certification,
    homepage: details.homepage ?? null,
    originalLanguage: details.original_language ?? "",
    cast: normalizeCast(details.credits),
    crew: normalizeCrew(details.credits),
    trailerKey: pickTrailerKey(details.videos?.results),
    similar: withPoster(
      (details.similar?.results ?? []).map((row) => normalizeMovie(row)),
    ),
    recommendations: withPoster(
      (details.recommendations?.results ?? []).map((row) => normalizeMovie(row)),
    ),
    seasons: [],
    numberOfSeasons: null,
    numberOfEpisodes: null,
    lastAirDate: null,
    networks: (details.production_companies ?? []).map((company) => company.name),
    createdBy: [],
  };
}

export function normalizeTVDetails(details: TMDBTVDetails): MediaDetail {
  const base = normalizeTV(details);
  const rating =
    details.content_ratings?.results?.find((entry) => entry.iso_3166_1 === "US")
      ?.rating ?? "";
  const runtime = details.episode_run_time?.[0] ?? null;
  const seasons = (details.seasons ?? [])
    .filter((season) => season.season_number > 0 && season.episode_count > 0)
    .map(normalizeSeasonSummary);
  const firstSeason = seasons[0]?.seasonNumber ?? 1;

  return {
    ...base,
    watchHref: `/watch/tv/${details.id}/${firstSeason}/1`,
    tagline: details.tagline?.trim() ?? "",
    genres: details.genres ?? [],
    runtimeMinutes: runtime,
    status: details.status ?? "",
    certification: rating,
    homepage: details.homepage ?? null,
    originalLanguage: details.original_language ?? "",
    cast: normalizeCast(details.credits),
    crew: normalizeCrew(details.credits),
    trailerKey: pickTrailerKey(details.videos?.results),
    similar: withPoster((details.similar?.results ?? []).map((row) => normalizeTV(row))),
    recommendations: withPoster(
      (details.recommendations?.results ?? []).map((row) => normalizeTV(row)),
    ),
    seasons,
    numberOfSeasons: details.number_of_seasons ?? seasons.length,
    numberOfEpisodes: details.number_of_episodes ?? null,
    lastAirDate: details.last_air_date ?? null,
    networks: (details.networks ?? []).map((network) => network.name),
    createdBy: (details.created_by ?? []).map((person) => person.name),
  };
}
