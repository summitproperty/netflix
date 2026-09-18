import type { MediaType } from "@/types/tmdb";

/**
 * TMDB genre ids. These are stable, documented constants, so keeping a local
 * copy avoids an extra round trip on every render. `fetchGenres()` in the media
 * service can still be used when you want the live list.
 */

export const MOVIE_GENRES: Record<string, number> = {
  Action: 28,
  Adventure: 12,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Fantasy: 14,
  History: 36,
  Horror: 27,
  Music: 10402,
  Mystery: 9648,
  Romance: 10749,
  "Sci-Fi": 878,
  Thriller: 53,
  War: 10752,
  Western: 37,
};

export const TV_GENRES: Record<string, number> = {
  "Action & Adventure": 10759,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Kids: 10762,
  Mystery: 9648,
  News: 10763,
  Reality: 10764,
  "Sci-Fi & Fantasy": 10765,
  Soap: 10766,
  Talk: 10767,
  "War & Politics": 10768,
  Western: 37,
};

export function genreMap(mediaType: MediaType): Record<string, number> {
  return mediaType === "movie" ? MOVIE_GENRES : TV_GENRES;
}

export function genreName(mediaType: MediaType, id: number): string | null {
  const entries = Object.entries(genreMap(mediaType));
  const found = entries.find(([, value]) => value === id);
  return found ? found[0] : null;
}

export function genreId(mediaType: MediaType, name: string): number | null {
  const map = genreMap(mediaType);
  const key = Object.keys(map).find(
    (candidate) => candidate.toLowerCase() === name.toLowerCase(),
  );
  return key ? map[key] : null;
}

/** Genre rails rendered on the homepage, in order. */
export const HOMEPAGE_GENRE_ROWS: Array<{ label: string; genreId: number }> = [
  { label: "Action", genreId: MOVIE_GENRES.Action },
  { label: "Adventure", genreId: MOVIE_GENRES.Adventure },
  { label: "Comedy", genreId: MOVIE_GENRES.Comedy },
  { label: "Drama", genreId: MOVIE_GENRES.Drama },
  { label: "Horror", genreId: MOVIE_GENRES.Horror },
  { label: "Thriller", genreId: MOVIE_GENRES.Thriller },
  { label: "Romance", genreId: MOVIE_GENRES.Romance },
  { label: "Sci-Fi", genreId: MOVIE_GENRES["Sci-Fi"] },
  { label: "Animation", genreId: MOVIE_GENRES.Animation },
];

/** Poster art for genre tiles on /genres, keyed by genre label. */
export const GENRE_ACCENTS: Record<string, string> = {
  Action: "from-red-900/70 to-ink-900",
  Adventure: "from-amber-900/60 to-ink-900",
  Animation: "from-sky-900/60 to-ink-900",
  Comedy: "from-yellow-900/60 to-ink-900",
  Crime: "from-slate-800/70 to-ink-900",
  Documentary: "from-emerald-900/60 to-ink-900",
  Drama: "from-purple-900/60 to-ink-900",
  Family: "from-teal-900/60 to-ink-900",
  Fantasy: "from-indigo-900/60 to-ink-900",
  History: "from-stone-800/70 to-ink-900",
  Horror: "from-neutral-900 to-ink-900",
  Music: "from-pink-900/60 to-ink-900",
  Mystery: "from-cyan-900/60 to-ink-900",
  Romance: "from-rose-900/60 to-ink-900",
  "Sci-Fi": "from-blue-900/60 to-ink-900",
  Thriller: "from-orange-900/60 to-ink-900",
  War: "from-lime-900/50 to-ink-900",
  Western: "from-amber-800/60 to-ink-900",
};

export function genreAccent(label: string): string {
  return GENRE_ACCENTS[label] ?? "from-ink-600 to-ink-900";
}
