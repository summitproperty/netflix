import { NextResponse } from "next/server";

import { clientKey, rateLimit } from "@/lib/utils/rate-limit";
import { logError, toUserMessage } from "@/lib/utils/errors";
import {
  discover,
  getAiringTodayTV,
  getNowPlayingMovies,
  getOnTheAirTV,
  getPopularMovies,
  getPopularTV,
  getTopRatedMovies,
  getTopRatedTV,
  getTrending,
  getUpcomingMovies,
} from "@/services/media.service";
import type { MediaType } from "@/types/tmdb";
import type { PagedMedia } from "@/types/media";

/**
 * GET /api/media/browse?type=movie&sort=popular&page=2&genre=28
 *
 * Powers "load more" on the browse/genre grids. Only the sort keys listed below
 * are accepted, so this can never be used as a generic TMDB proxy.
 */

export const dynamic = "force-dynamic";

const MOVIE_SORTS = [
  "popular",
  "top_rated",
  "now_playing",
  "upcoming",
  "trending",
] as const;
const TV_SORTS = [
  "popular",
  "top_rated",
  "airing_today",
  "on_the_air",
  "trending",
] as const;

function resolve(
  mediaType: MediaType,
  sort: string,
  page: number,
  genreId?: number,
): Promise<PagedMedia> {
  if (genreId) {
    return discover(mediaType, { genreId, page });
  }

  if (mediaType === "movie") {
    switch (sort) {
      case "top_rated":
        return getTopRatedMovies(page);
      case "now_playing":
        return getNowPlayingMovies(page);
      case "upcoming":
        return getUpcomingMovies(page);
      case "trending":
        return getTrending("movie", "week", page);
      default:
        return getPopularMovies(page);
    }
  }

  switch (sort) {
    case "top_rated":
      return getTopRatedTV(page);
    case "airing_today":
      return getAiringTodayTV(page);
    case "on_the_air":
      return getOnTheAirTV(page);
    case "trending":
      return getTrending("tv", "week", page);
    default:
      return getPopularTV(page);
  }
}

export async function GET(request: Request) {
  const limit = rateLimit(clientKey(request, "browse"), 120, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type") === "tv" ? "tv" : "movie";
  const sort = url.searchParams.get("sort") ?? "popular";
  const pageParam = Number(url.searchParams.get("page") ?? "1");
  const page =
    Number.isInteger(pageParam) && pageParam > 0 ? Math.min(pageParam, 500) : 1;

  const genreParam = Number(url.searchParams.get("genre") ?? "");
  const genreId = Number.isInteger(genreParam) && genreParam > 0 ? genreParam : undefined;

  const allowed: readonly string[] = type === "movie" ? MOVIE_SORTS : TV_SORTS;
  if (!genreId && !allowed.includes(sort)) {
    return NextResponse.json(
      { error: `Unsupported sort "${sort}" for ${type}.` },
      { status: 400 },
    );
  }

  try {
    const results = await resolve(type, sort, page, genreId);
    return NextResponse.json(results, {
      headers: {
        "Cache-Control": "public, max-age=120, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    logError("api/media/browse", error);
    return NextResponse.json({ error: toUserMessage(error) }, { status: 502 });
  }
}
