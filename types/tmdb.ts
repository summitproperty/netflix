/** Raw TMDB API response shapes (only the fields this app consumes). */

export type MediaType = "movie" | "tv";

export interface TMDBPaginated<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBMovie {
  id: number;
  title: string;
  original_title?: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string | null;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  genre_ids?: number[];
  adult?: boolean;
  media_type?: "movie";
}

export interface TMDBTVShow {
  id: number;
  name: string;
  original_name?: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date?: string | null;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  genre_ids?: number[];
  media_type?: "tv";
}

export interface TMDBPerson {
  id: number;
  name: string;
  known_for_department?: string;
  profile_path?: string | null;
  media_type?: "person";
}

export type TMDBMultiSearchResult = TMDBMovie | TMDBTVShow | TMDBPerson;

export interface TMDBCastMember {
  id: number;
  name: string;
  character?: string;
  profile_path: string | null;
  order?: number;
}

export interface TMDBCrewMember {
  id: number;
  name: string;
  job?: string;
  department?: string;
  profile_path: string | null;
}

export interface TMDBCredits {
  cast?: TMDBCastMember[];
  crew?: TMDBCrewMember[];
}

export interface TMDBVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official?: boolean;
}

export interface TMDBProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
}

export interface TMDBMovieDetails extends TMDBMovie {
  runtime: number | null;
  genres: TMDBGenre[];
  status?: string;
  tagline?: string | null;
  homepage?: string | null;
  imdb_id?: string | null;
  budget?: number;
  revenue?: number;
  original_language?: string;
  production_companies?: TMDBProductionCompany[];
  credits?: TMDBCredits;
  videos?: { results: TMDBVideo[] };
  similar?: TMDBPaginated<TMDBMovie>;
  recommendations?: TMDBPaginated<TMDBMovie>;
  release_dates?: {
    results: Array<{
      iso_3166_1: string;
      release_dates: Array<{ certification: string; type: number }>;
    }>;
  };
}

export interface TMDBEpisode {
  id: number;
  name: string;
  overview: string | null;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  air_date: string | null;
  runtime?: number | null;
  vote_average?: number;
}

export interface TMDBSeasonSummary {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  air_date: string | null;
  overview: string | null;
  poster_path: string | null;
}

export interface TMDBSeasonDetails extends TMDBSeasonSummary {
  episodes: TMDBEpisode[];
}

export interface TMDBTVDetails extends TMDBTVShow {
  genres: TMDBGenre[];
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: TMDBSeasonSummary[];
  status?: string;
  tagline?: string | null;
  homepage?: string | null;
  last_air_date?: string | null;
  original_language?: string;
  networks?: TMDBProductionCompany[];
  created_by?: Array<{ id: number; name: string; profile_path: string | null }>;
  credits?: TMDBCredits;
  videos?: { results: TMDBVideo[] };
  similar?: TMDBPaginated<TMDBTVShow>;
  recommendations?: TMDBPaginated<TMDBTVShow>;
  content_ratings?: {
    results: Array<{ iso_3166_1: string; rating: string }>;
  };
}
