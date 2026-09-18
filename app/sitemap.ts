import type { MetadataRoute } from "next";

import { MOVIE_GENRES, TV_GENRES } from "@/lib/tmdb/genres";
import { getSiteUrl } from "@/lib/config/site";
import { getPopularMovies, getPopularTV, getTrending } from "@/services/media.service";

/*
 * Dynamic sitemap: static pages + every genre landing page + the currently
 * popular/trending titles. Account pages are deliberately excluded (they are
 * noindex and personal). Regenerated daily.
 */

export const revalidate = 86400;

const STATIC_PATHS: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/movies", priority: 0.9, changeFrequency: "daily" },
  { path: "/tv", priority: 0.9, changeFrequency: "daily" },
  { path: "/genres", priority: 0.7, changeFrequency: "monthly" },
  { path: "/search", priority: 0.5, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  // Titles are best-effort: a TMDB outage must not fail the sitemap build.
  const [trending, movies, shows] = await Promise.all([
    getTrending("all", "week", 1).catch(() => null),
    getPopularMovies(1).catch(() => null),
    getPopularTV(1).catch(() => null),
  ]);

  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((entry) => ({
    url: `${base}${entry.path}`,
    lastModified: now,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));

  // `?sort=` variants are intentionally absent. They are re-orderings of the
  // same catalogue, so listing them would submit near-duplicate URLs; the
  // canonical /movies and /tv entries above cover them.

  for (const [, id] of Object.entries(MOVIE_GENRES)) {
    entries.push({
      url: `${base}/genres/movie/${id}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }
  for (const [, id] of Object.entries(TV_GENRES)) {
    entries.push({
      url: `${base}/genres/tv/${id}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  const titles = [
    ...(trending?.items ?? []),
    ...(movies?.items ?? []),
    ...(shows?.items ?? []),
  ];

  const seen = new Set<string>();
  for (const item of titles) {
    const key = `${item.mediaType}-${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({
      url: `${base}${item.href}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  return entries;
}
