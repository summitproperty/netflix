import "server-only";

import { requireSupabaseServerClient } from "@/lib/supabase/server";
import { formatYear } from "@/lib/utils/format";
import { AppError, logError } from "@/lib/utils/errors";
import type { MediaItem } from "@/types/media";
import type { MyListRow } from "@/types/database";
import type { MediaType } from "@/types/tmdb";

/**
 * My List persistence. Rows are denormalized snapshots (title/poster) so the
 * list page renders in a single query without fanning out to TMDB.
 */

function rowToMediaItem(row: MyListRow): MediaItem {
  const base = {
    id: row.tmdb_id,
    mediaType: row.media_type,
    title: row.title,
    overview: "",
    posterPath: row.poster_path,
    backdropPath: row.backdrop_path,
    releaseDate: row.release_date,
    year: formatYear(row.release_date),
    voteAverage: row.vote_average ?? 0,
    voteCount: 0,
    genreIds: [] as number[],
  };

  return row.media_type === "movie"
    ? {
        ...base,
        href: `/movie/${row.tmdb_id}`,
        watchHref: `/watch/movie/${row.tmdb_id}`,
      }
    : {
        ...base,
        href: `/tv/${row.tmdb_id}`,
        // Saved rows hold no season data; the watch route forwards S1 E1 to the
        // show's real first season when season 1 does not exist.
        watchHref: `/watch/tv/${row.tmdb_id}/1/1`,
      };
}

export async function getMyList(userId: string): Promise<MediaItem[]> {
  const supabase = await requireSupabaseServerClient();
  const { data, error } = await supabase
    .from("my_list")
    .select(
      "id, user_id, media_type, tmdb_id, title, poster_path, backdrop_path, release_date, vote_average, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .overrideTypes<MyListRow[], { merge: false }>();

  if (error) {
    logError("mylist/get", error);
    throw new AppError("database", "Could not load your list.", 500);
  }

  return (data ?? []).map(rowToMediaItem);
}

export async function isInMyList(
  userId: string,
  mediaType: MediaType,
  tmdbId: number,
): Promise<boolean> {
  const supabase = await requireSupabaseServerClient();
  const { data, error } = await supabase
    .from("my_list")
    .select("id")
    .eq("user_id", userId)
    .eq("media_type", mediaType)
    .eq("tmdb_id", tmdbId)
    .maybeSingle();

  if (error) {
    logError("mylist/exists", error);
    return false;
  }
  return data !== null;
}

/** Ids only, used to mark cards inside grids without extra round trips. */
export async function getMyListKeys(userId: string): Promise<Set<string>> {
  const supabase = await requireSupabaseServerClient();
  const { data, error } = await supabase
    .from("my_list")
    .select("media_type, tmdb_id")
    .eq("user_id", userId);

  if (error) {
    logError("mylist/keys", error);
    return new Set();
  }
  return new Set((data ?? []).map((row) => `${row.media_type}-${row.tmdb_id}`));
}

export interface MyListInput {
  mediaType: MediaType;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  voteAverage: number | null;
}

export async function addToMyList(userId: string, input: MyListInput): Promise<void> {
  const supabase = await requireSupabaseServerClient();
  const { error } = await supabase.from("my_list").upsert(
    {
      user_id: userId,
      media_type: input.mediaType,
      tmdb_id: input.tmdbId,
      title: input.title.slice(0, 300),
      poster_path: input.posterPath,
      backdrop_path: input.backdropPath,
      release_date: input.releaseDate,
      vote_average: input.voteAverage,
    },
    { onConflict: "user_id,media_type,tmdb_id" },
  );

  if (error) {
    logError("mylist/add", error);
    throw new AppError("database", "Could not add that title to your list.", 500);
  }
}

export async function removeFromMyList(
  userId: string,
  mediaType: MediaType,
  tmdbId: number,
): Promise<void> {
  const supabase = await requireSupabaseServerClient();
  const { error } = await supabase
    .from("my_list")
    .delete()
    .eq("user_id", userId)
    .eq("media_type", mediaType)
    .eq("tmdb_id", tmdbId);

  if (error) {
    logError("mylist/remove", error);
    throw new AppError("database", "Could not remove that title.", 500);
  }
}

export async function countMyList(userId: string): Promise<number> {
  const supabase = await requireSupabaseServerClient();
  const { count, error } = await supabase
    .from("my_list")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    logError("mylist/count", error);
    return 0;
  }
  return count ?? 0;
}
