import type { Metadata } from "next";

import { GenreTiles } from "@/components/media/GenreTiles";
import { PageHeader } from "@/components/ui/PageHeader";
import { MOVIE_GENRES, TV_GENRES } from "@/lib/tmdb/genres";
import { getGenres } from "@/services/media.service";

/*
 * /genres — index of every movie and TV genre. Uses the live TMDB genre lists
 * when they are reachable and falls back to the bundled constants otherwise, so
 * this page never renders empty.
 */

function fallback(map: Record<string, number>): Array<{ id: number; name: string }> {
  return Object.entries(map).map(([name, id]) => ({ id, name }));
}

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Genres",
  description:
    "Browse movies and TV shows by genre — action, comedy, drama, horror, sci-fi, romance, animation and more.",
  alternates: { canonical: "/genres" },
};

export default async function GenresPage() {
  const [movieGenres, tvGenres] = await Promise.all([
    getGenres("movie"),
    getGenres("tv"),
  ]);

  const movies = movieGenres.length > 0 ? movieGenres : fallback(MOVIE_GENRES);
  const shows = tvGenres.length > 0 ? tvGenres : fallback(TV_GENRES);

  return (
    <div className="page-shell">
      <PageHeader
        title="Genres"
        description="Pick a mood. Every genre opens a full, endlessly scrollable catalog."
      />

      <section aria-labelledby="movie-genres">
        <h2
          id="movie-genres"
          className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-mist-500"
        >
          Movie genres
        </h2>
        <GenreTiles mediaType="movie" genres={movies} />
      </section>

      <section aria-labelledby="tv-genres" className="mt-10">
        <h2
          id="tv-genres"
          className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-mist-500"
        >
          TV genres
        </h2>
        <GenreTiles mediaType="tv" genres={shows} />
      </section>
    </div>
  );
}
