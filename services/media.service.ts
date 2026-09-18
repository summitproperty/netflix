import "server-only";

import { REVALIDATE, tmdbFetch, tmdbFetchSafe } from "@/lib/tmdb/client";
import {
  normalizeMovieDetails,
  normalizeMultiPaged,
  normalizePaged,
  normalizeSeason,
  normalizeTVDetails,
  withPoster,
} from "@/lib/tmdb/normalize";
import { serverEnv } from "@/lib/config/server-env";
import { TMDBError } from "@/lib/utils/errors";
import type { MediaDetail, MediaItem, PagedMedia, SeasonDetail } from "@/types/media";
import type {
  MediaType,
  TMDBGenre,
  TMDBMovie,
  TMDBMovieDetails,
  TMDBMultiSearchResult,
  TMDBPaginated,
  TMDBSeasonDetails,
  TMDBTVDetails,
  TMDBTVShow,
} from "@/types/tmdb";

/**
 * Media service: the only place the app builds TMDB request paths.
 * Everything returns app-normalized models, never raw TMDB payloads.
 */

type List = TMDBPaginated<TMDBMovie | TMDBTVShow>;

/* ------------------------------- discovery -------------------------------- */

export async function getTrending(
  mediaType: MediaType | "all" = "all",
  window: "day" | "week" = "week",
  page = 1,
): Promise<PagedMedia> {
  const payload = await tmdbFetchSafe<TMDBPaginated<TMDBMultiSearchResult>>(
    `/trending/${mediaType}/${window}`,
    { params: { page }, revalidate: REVALIDATE.short },
    "trending",
  );
  return normalizeMultiPaged(payload);
}

async function list(
  path: string,
  mediaType: MediaType,
  page: number,
  revalidate: number,
  extraParams: Record<string, string | number> = {},
): Promise<PagedMedia> {
  const payload = await tmdbFetchSafe<List>(
    path,
    { params: { page, ...extraParams }, revalidate },
    path,
  );
  return normalizePaged(payload, mediaType);
}

export function getPopularMovies(page = 1): Promise<PagedMedia> {
  return list("/movie/popular", "movie", page, REVALIDATE.medium);
}

export function getTopRatedMovies(page = 1): Promise<PagedMedia> {
  return list("/movie/top_rated", "movie", page, REVALIDATE.medium);
}

export function getNowPlayingMovies(page = 1): Promise<PagedMedia> {
  return list("/movie/now_playing", "movie", page, REVALIDATE.short, {
    region: serverEnv.tmdbRegion,
  });
}

export function getUpcomingMovies(page = 1): Promise<PagedMedia> {
  return list("/movie/upcoming", "movie", page, REVALIDATE.medium, {
    region: serverEnv.tmdbRegion,
  });
}

export function getPopularTV(page = 1): Promise<PagedMedia> {
  return list("/tv/popular", "tv", page, REVALIDATE.medium);
}

export function getTopRatedTV(page = 1): Promise<PagedMedia> {
  return list("/tv/top_rated", "tv", page, REVALIDATE.medium);
}

export function getAiringTodayTV(page = 1): Promise<PagedMedia> {
  return list("/tv/airing_today", "tv", page, REVALIDATE.short);
}

export function getOnTheAirTV(page = 1): Promise<PagedMedia> {
  return list("/tv/on_the_air", "tv", page, REVALIDATE.short);
}

export interface DiscoverOptions {
  page?: number;
  genreId?: number;
  sortBy?: string;
  year?: number;
  minVoteCount?: number;
}

export function discover(
  mediaType: MediaType,
  options: DiscoverOptions = {},
): Promise<PagedMedia> {
  const {
    page = 1,
    genreId,
    sortBy = "popularity.desc",
    year,
    minVoteCount = 80,
  } = options;

  const params: Record<string, string | number> = {
    sort_by: sortBy,
    include_adult: "false",
    "vote_count.gte": minVoteCount,
  };
  if (genreId) params.with_genres = genreId;
  if (year && mediaType === "movie") params.primary_release_year = year;
  if (year && mediaType === "tv") params.first_air_date_year = year;

  return list(`/discover/${mediaType}`, mediaType, page, REVALIDATE.medium, params);
}

export async function getGenres(mediaType: MediaType): Promise<TMDBGenre[]> {
  const payload = await tmdbFetchSafe<{ genres: TMDBGenre[] }>(
    `/genre/${mediaType}/list`,
    { revalidate: REVALIDATE.week },
    "genres",
  );
  return payload?.genres ?? [];
}

/* --------------------------------- search --------------------------------- */

export async function searchMulti(query: string, page = 1): Promise<PagedMedia> {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return { page: 1, totalPages: 0, totalResults: 0, items: [] };
  }
  const payload = await tmdbFetchSafe<TMDBPaginated<TMDBMultiSearchResult>>(
    "/search/multi",
    {
      params: { query: trimmed, page, include_adult: "false" },
      revalidate: REVALIDATE.short,
    },
    "search",
  );
  return normalizeMultiPaged(payload);
}

export async function searchByType(
  mediaType: MediaType,
  query: string,
  page = 1,
): Promise<PagedMedia> {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return { page: 1, totalPages: 0, totalResults: 0, items: [] };
  }
  const payload = await tmdbFetchSafe<List>(
    `/search/${mediaType}`,
    {
      params: { query: trimmed, page, include_adult: "false" },
      revalidate: REVALIDATE.short,
    },
    "search",
  );
  return normalizePaged(payload, mediaType);
}

/* --------------------------------- details -------------------------------- */

const MOVIE_APPEND = "credits,videos,similar,recommendations,release_dates";
const TV_APPEND = "credits,videos,similar,recommendations,content_ratings";

export async function getMovieDetails(id: number): Promise<MediaDetail> {
  const payload = await tmdbFetch<TMDBMovieDetails>(`/movie/${id}`, {
    params: { append_to_response: MOVIE_APPEND },
    revalidate: REVALIDATE.long,
    tags: [`movie-${id}`],
  });
  return normalizeMovieDetails(payload);
}

export async function getTVDetails(id: number): Promise<MediaDetail> {
  const payload = await tmdbFetch<TMDBTVDetails>(`/tv/${id}`, {
    params: { append_to_response: TV_APPEND },
    revalidate: REVALIDATE.long,
    tags: [`tv-${id}`],
  });
  return normalizeTVDetails(payload);
}

export async function getDetails(
  mediaType: MediaType,
  id: number,
): Promise<MediaDetail> {
  return mediaType === "movie" ? getMovieDetails(id) : getTVDetails(id);
}

export async function getSeason(
  tvId: number,
  seasonNumber: number,
): Promise<SeasonDetail> {
  const payload = await tmdbFetch<TMDBSeasonDetails>(
    `/tv/${tvId}/season/${seasonNumber}`,
    { revalidate: REVALIDATE.long, tags: [`tv-${tvId}-season-${seasonNumber}`] },
  );
  return normalizeSeason(payload);
}

/** Season fetch that returns null instead of throwing (used by watch pages). */
export async function getSeasonSafe(
  tvId: number,
  seasonNumber: number,
): Promise<SeasonDetail | null> {
  try {
    return await getSeason(tvId, seasonNumber);
  } catch {
    return null;
  }
}

export async function getRelated(
  mediaType: MediaType,
  id: number,
): Promise<MediaItem[]> {
  const detail = await (mediaType === "movie"
    ? getMovieDetails(id)
    : getTVDetails(id));
  const combined = [...detail.recommendations, ...detail.similar];
  return withPoster(combined).slice(0, 20);
}

/** Resolve a single title, throwing a 404-flavoured error for bad ids. */
export async function requireDetails(
  mediaType: MediaType,
  rawId: string,
): Promise<MediaDetail> {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new TMDBError(`Invalid ${mediaType} id: ${rawId}`, 404);
  }
  return getDetails(mediaType, id);
}
