import "server-only";

import { AppError, logError } from "@/lib/utils/errors";
import { getDetails } from "@/services/media.service";
import { requireSupabaseServerClient } from "@/lib/supabase/server";
import type { WatchProgressRow } from "@/types/database";
import type { MediaItem } from "@/types/media";
import type { MediaType } from "@/types/tmdb";

/**
 * "Continue Watching" / recently-watched persistence, backed by the existing
 * `watch_progress` table (supabase/schema.sql) — no schema change was made
 * for this.
 *
 * HONEST LIMITATION: the video player is a third-party, cross-origin iframe
 * embed (see components/video/VideoPlayer.tsx's own comment on this), so
 * this app cannot read the embed's real playhead. `position_seconds` here is
 * therefore an approximation — elapsed session time since the player
 * mounted, saved periodically — not a frame-accurate resume point, and nothing
 * in the app seeks the embed to a saved position (not possible either, for
 * the same cross-origin reason). This powers a "Continue Watching" row
 * (recently-watched, most-recent first) rather than a precise resume.
 *
 * `watch_progress.season_number`/`episode_number` are nullable (null for
 * movies), and Postgres treats each NULL as distinct for uniqueness
 * purposes — so a plain `upsert(...).onConflict(...)` would never match an
 * existing movie row and would insert a new one every save. `upsertWatchProgress`
 * below does an explicit select-then-update/insert instead, which is correct
 * regardless of that NULL behavior and needed no schema change.
 */

export interface WatchProgressInput {
  mediaType: MediaType;
  tmdbId: number;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
  positionSeconds: number;
  durationSeconds?: number | null;
}

export async function upsertWatchProgress(
  userId: string,
  input: WatchProgressInput,
): Promise<void> {
  const supabase = await requireSupabaseServerClient();
  const seasonNumber = input.seasonNumber ?? null;
  const episodeNumber = input.episodeNumber ?? null;

  let existingQuery = supabase
    .from("watch_progress")
    .select("id")
    .eq("user_id", userId)
    .eq("media_type", input.mediaType)
    .eq("tmdb_id", input.tmdbId);
  existingQuery =
    seasonNumber === null
      ? existingQuery.is("season_number", null)
      : existingQuery.eq("season_number", seasonNumber);
  existingQuery =
    episodeNumber === null
      ? existingQuery.is("episode_number", null)
      : existingQuery.eq("episode_number", episodeNumber);

  const { data: existing, error: lookupError } = await existingQuery.maybeSingle();
  if (lookupError) {
    logError("watch-progress/lookup", lookupError);
    throw new AppError("database", "Could not save playback progress.", 500);
  }

  const payload = {
    user_id: userId,
    media_type: input.mediaType,
    tmdb_id: input.tmdbId,
    season_number: seasonNumber,
    episode_number: episodeNumber,
    position_seconds: Math.max(0, Math.round(input.positionSeconds)),
    duration_seconds:
      input.durationSeconds != null ? Math.max(0, Math.round(input.durationSeconds)) : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = existing
    ? await supabase.from("watch_progress").update(payload).eq("id", existing.id)
    : await supabase.from("watch_progress").insert(payload);

  if (error) {
    logError("watch-progress/upsert", error);
    throw new AppError("database", "Could not save playback progress.", 500);
  }
}

export async function removeWatchProgress(
  userId: string,
  mediaType: MediaType,
  tmdbId: number,
): Promise<void> {
  const supabase = await requireSupabaseServerClient();
  const { error } = await supabase
    .from("watch_progress")
    .delete()
    .eq("user_id", userId)
    .eq("media_type", mediaType)
    .eq("tmdb_id", tmdbId);

  if (error) {
    logError("watch-progress/remove", error);
    throw new AppError("database", "Could not update your Continue Watching row.", 500);
  }
}

const CONTINUE_WATCHING_LIMIT = 12;

/**
 * Most-recently-watched titles, TMDB-enriched for display. A row whose TMDB
 * lookup fails (title pulled from TMDB, transient network error) is
 * silently skipped rather than breaking the whole row — same "secondary
 * data failing must not take down the page" rule the rest of the dashboard
 * follows.
 */
export async function getContinueWatching(userId: string): Promise<MediaItem[]> {
  const supabase = await requireSupabaseServerClient();
  const { data, error } = await supabase
    .from("watch_progress")
    .select(
      "id, user_id, media_type, tmdb_id, season_number, episode_number, position_seconds, duration_seconds, updated_at",
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(CONTINUE_WATCHING_LIMIT)
    .overrideTypes<WatchProgressRow[], { merge: false }>();

  if (error) {
    logError("watch-progress/list", error);
    return [];
  }
  if (!data || data.length === 0) return [];

  const enriched = await Promise.allSettled(
    data.map(async (row): Promise<MediaItem> => {
      const detail = await getDetails(row.media_type, row.tmdb_id);
      if (row.media_type === "tv" && row.season_number && row.episode_number) {
        return {
          ...detail,
          watchHref: `/watch/tv/${row.tmdb_id}/${row.season_number}/${row.episode_number}`,
        };
      }
      return detail;
    }),
  );

  return enriched
    .filter(
      (result): result is PromiseFulfilledResult<MediaItem> => result.status === "fulfilled",
    )
    .map((result) => result.value);
}
