/**
 * Database types for the Supabase schema in supabase/schema.sql.
 *
 * Regenerate after schema changes with:
 *   npx supabase gen types typescript --project-id <ref> > types/database.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type MyListRow = {
  id: string;
  user_id: string;
  media_type: "movie" | "tv";
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  vote_average: number | null;
  created_at: string;
};

export type WatchProgressRow = {
  id: string;
  user_id: string;
  media_type: "movie" | "tv";
  tmdb_id: number;
  season_number: number | null;
  episode_number: number | null;
  position_seconds: number;
  duration_seconds: number | null;
  updated_at: string;
};

export type RatingRow = {
  id: string;
  user_id: string;
  media_type: "movie" | "tv";
  tmdb_id: number;
  value: 1 | -1;
  created_at: string;
  updated_at: string;
};

export type SearchHistoryRow = {
  id: string;
  user_id: string;
  query: string;
  created_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<Omit<ProfileRow, "id">> & { id: string };
        Update: Partial<Omit<ProfileRow, "id">>;
        Relationships: [];
      };
      my_list: {
        Row: MyListRow;
        Insert: Omit<MyListRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<MyListRow, "id" | "user_id">>;
        Relationships: [];
      };
      watch_progress: {
        Row: WatchProgressRow;
        Insert: Omit<WatchProgressRow, "id" | "updated_at"> & {
          id?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<WatchProgressRow, "id" | "user_id">>;
        Relationships: [];
      };
      ratings: {
        Row: RatingRow;
        Insert: Omit<RatingRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<RatingRow, "id" | "user_id">>;
        Relationships: [];
      };
      search_history: {
        Row: SearchHistoryRow;
        Insert: Omit<SearchHistoryRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<SearchHistoryRow, "id" | "user_id">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      media_type: "movie" | "tv";
    };
    CompositeTypes: Record<string, never>;
  };
}
