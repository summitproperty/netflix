import type { MediaType } from "@/types/tmdb";

/**
 * Normalized card/detail shapes used by every component, so the UI never has
 * to branch on TMDB's movie-vs-tv field naming (title/name, release_date/
 * first_air_date).
 */

export interface MediaItem {
  id: number;
  mediaType: MediaType;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  year: string;
  voteAverage: number;
  voteCount: number;
  genreIds: number[];
  href: string;
  watchHref: string;
}

export interface CastMember {
  id: number;
  name: string;
  role: string;
  profilePath: string | null;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  profilePath: string | null;
}

export interface MediaDetail extends MediaItem {
  tagline: string;
  genres: Array<{ id: number; name: string }>;
  runtimeMinutes: number | null;
  status: string;
  certification: string;
  homepage: string | null;
  originalLanguage: string;
  cast: CastMember[];
  crew: CrewMember[];
  trailerKey: string | null;
  similar: MediaItem[];
  recommendations: MediaItem[];
  /** TV only */
  seasons: SeasonSummary[];
  numberOfSeasons: number | null;
  numberOfEpisodes: number | null;
  lastAirDate: string | null;
  networks: string[];
  createdBy: string[];
}

export interface SeasonSummary {
  id: number;
  name: string;
  seasonNumber: number;
  episodeCount: number;
  airDate: string | null;
  overview: string;
  posterPath: string | null;
}

export interface EpisodeItem {
  id: number;
  name: string;
  overview: string;
  seasonNumber: number;
  episodeNumber: number;
  stillPath: string | null;
  airDate: string | null;
  runtimeMinutes: number | null;
  voteAverage: number;
}

export interface SeasonDetail extends SeasonSummary {
  episodes: EpisodeItem[];
}

export interface PagedMedia {
  page: number;
  totalPages: number;
  totalResults: number;
  items: MediaItem[];
}

export interface MediaRow {
  /** Stable key, also used as the rail's anchor id. */
  id: string;
  title: string;
  href?: string;
  items: MediaItem[];
}

export type { MediaType };
