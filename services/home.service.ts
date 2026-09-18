import "server-only";

import { HOMEPAGE_GENRE_ROWS } from "@/lib/tmdb/genres";
import { withPoster } from "@/lib/tmdb/normalize";
import {
  discover,
  getNowPlayingMovies,
  getPopularMovies,
  getPopularTV,
  getTopRatedMovies,
  getTopRatedTV,
  getTrending,
  getUpcomingMovies,
} from "@/services/media.service";
import type { MediaItem, MediaRow } from "@/types/media";

export interface HomeFeed {
  /** Rotating hero candidates: trending titles that actually have a backdrop. */
  hero: MediaItem[];
  rows: MediaRow[];
}

/**
 * Builds the whole homepage in one pass. Every request runs in parallel and any
 * individual failure degrades to an empty rail (see tmdbFetchSafe), so the page
 * still renders if one TMDB endpoint misbehaves.
 */
export async function getHomeFeed(): Promise<HomeFeed> {
  const [
    trending,
    popularMovies,
    topRatedMovies,
    nowPlaying,
    upcoming,
    popularTV,
    topRatedTV,
    ...genreLists
  ] = await Promise.all([
    getTrending("all", "week").catch((error) => {
      console.error("Homepage trending failed:", error);
      return { page: 1, totalPages: 0, totalResults: 0, items: [] };
    }),
    getPopularMovies().catch((error) => {
      console.error("Homepage popular movies failed:", error);
      return { page: 1, totalPages: 0, totalResults: 0, items: [] };
    }),
    getTopRatedMovies().catch((error) => {
      console.error("Homepage top rated movies failed:", error);
      return { page: 1, totalPages: 0, totalResults: 0, items: [] };
    }),
    getNowPlayingMovies().catch((error) => {
      console.error("Homepage now playing failed:", error);
      return { page: 1, totalPages: 0, totalResults: 0, items: [] };
    }),
    getUpcomingMovies().catch((error) => {
      console.error("Homepage upcoming failed:", error);
      return { page: 1, totalPages: 0, totalResults: 0, items: [] };
    }),
    getPopularTV().catch((error) => {
      console.error("Homepage popular TV failed:", error);
      return { page: 1, totalPages: 0, totalResults: 0, items: [] };
    }),
    getTopRatedTV().catch((error) => {
      console.error("Homepage top rated TV failed:", error);
      return { page: 1, totalPages: 0, totalResults: 0, items: [] };
    }),
    ...HOMEPAGE_GENRE_ROWS.map((row) =>
      discover("movie", { genreId: row.genreId, minVoteCount: 120 }).catch((error) => {
        console.error(`Homepage genre ${row.genreId} failed:`, error);
        return { page: 1, totalPages: 0, totalResults: 0, items: [] };
      }),
    ),
  ]);

  const hero = trending.items
    .filter((item) => item.backdropPath !== null && item.overview.length > 60)
    .slice(0, 6);

  const rows: MediaRow[] = [
    { id: "trending", title: "Trending Now", items: withPoster(trending.items) },
    {
      id: "popular-movies",
      title: "Popular Movies",
      href: "/movies?sort=popular",
      items: withPoster(popularMovies.items),
    },
    {
      id: "top-rated",
      title: "Top Rated",
      href: "/movies?sort=top_rated",
      items: withPoster(topRatedMovies.items),
    },
    {
      id: "now-playing",
      title: "Now Playing",
      href: "/movies?sort=now_playing",
      items: withPoster(nowPlaying.items),
    },
    {
      id: "upcoming",
      title: "Upcoming",
      href: "/movies?sort=upcoming",
      items: withPoster(upcoming.items),
    },
    {
      id: "popular-tv",
      title: "Popular TV Shows",
      href: "/tv?sort=popular",
      items: withPoster(popularTV.items),
    },
    {
      id: "top-rated-tv",
      title: "Top Rated TV",
      href: "/tv?sort=top_rated",
      items: withPoster(topRatedTV.items),
    },
    ...HOMEPAGE_GENRE_ROWS.map((row, index) => ({
      id: `genre-${row.genreId}`,
      title: row.label,
      href: `/genres/movie/${row.genreId}`,
      items: withPoster(genreLists[index]?.items ?? []),
    })),
  ];

  return { hero, rows: rows.filter((row) => row.items.length > 0) };
}
