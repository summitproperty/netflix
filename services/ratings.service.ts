import "server-only";

import { AppError, logError } from "@/lib/utils/errors";
import { requireSupabaseServerClient } from "@/lib/supabase/server";
import type { MediaType } from "@/types/tmdb";

/**
 * Per-user like/dislike on a title. No neutral state is ever stored — a
 * cleared rating just deletes the row (mirrors My List: presence = the
 * whole signal).
 */
export type RatingValue = 1 | -1;

export async function getRating(
  userId: string,
  mediaType: MediaType,
  tmdbId: number,
): Promise<RatingValue | null> {
  const supabase = await requireSupabaseServerClient();
  const { data, error } = await supabase
    .from("ratings")
    .select("value")
    .eq("user_id", userId)
    .eq("media_type", mediaType)
    .eq("tmdb_id", tmdbId)
    .maybeSingle();

  if (error) {
    logError("ratings/get", error);
    return null;
  }
  return (data?.value as RatingValue | undefined) ?? null;
}

export async function setRating(
  userId: string,
  mediaType: MediaType,
  tmdbId: number,
  value: RatingValue,
): Promise<void> {
  const supabase = await requireSupabaseServerClient();
  const { error } = await supabase.from("ratings").upsert(
    {
      user_id: userId,
      media_type: mediaType,
      tmdb_id: tmdbId,
      value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,media_type,tmdb_id" },
  );

  if (error) {
    logError("ratings/set", error);
    throw new AppError("database", "Could not save your rating.", 500);
  }
}

export async function clearRating(
  userId: string,
  mediaType: MediaType,
  tmdbId: number,
): Promise<void> {
  const supabase = await requireSupabaseServerClient();
  const { error } = await supabase
    .from("ratings")
    .delete()
    .eq("user_id", userId)
    .eq("media_type", mediaType)
    .eq("tmdb_id", tmdbId);

  if (error) {
    logError("ratings/clear", error);
    throw new AppError("database", "Could not update your rating.", 500);
  }
}
