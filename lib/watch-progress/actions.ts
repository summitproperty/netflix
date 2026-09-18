"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { logError, toUserMessage } from "@/lib/utils/errors";
import { upsertWatchProgress } from "@/services/watch-progress.service";
import type { MediaType } from "@/types/tmdb";

export interface SaveWatchProgressInput {
  mediaType: MediaType;
  tmdbId: number;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
  positionSeconds: number;
  durationSeconds?: number | null;
}

export interface SaveWatchProgressResult {
  ok: boolean;
  message: string;
}

// Sanity ceilings only (not real durations) — reject obviously-malformed
// calls without guessing at what a "real" value should be.
const MAX_POSITION_SECONDS = 24 * 60 * 60;

function validate(input: SaveWatchProgressInput): string | null {
  if (input.mediaType !== "movie" && input.mediaType !== "tv") {
    return "Unsupported media type.";
  }
  if (!Number.isInteger(input.tmdbId) || input.tmdbId <= 0) {
    return "Invalid title id.";
  }
  if (
    !Number.isFinite(input.positionSeconds) ||
    input.positionSeconds < 0 ||
    input.positionSeconds > MAX_POSITION_SECONDS
  ) {
    return "Invalid playback position.";
  }
  if (input.mediaType === "tv") {
    if (
      input.seasonNumber == null ||
      input.episodeNumber == null ||
      !Number.isInteger(input.seasonNumber) ||
      !Number.isInteger(input.episodeNumber) ||
      input.seasonNumber < 0 ||
      input.episodeNumber < 1
    ) {
      return "Missing season/episode.";
    }
  }
  return null;
}

/**
 * Called directly (not as a form action) from VideoPlayer's client-side
 * progress-saving timer — server actions are callable like a normal async
 * function from a client component, so no separate API route is needed here.
 * Silently no-ops when signed out or when NEXT_PUBLIC_WATCH_PROGRESS_ENABLED
 * is off; the caller does not need to branch on that.
 */
export async function saveWatchProgressAction(
  input: SaveWatchProgressInput,
): Promise<SaveWatchProgressResult> {
  const invalid = validate(input);
  if (invalid) return { ok: false, message: invalid };

  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Not signed in." };

  try {
    await upsertWatchProgress(user.id, {
      mediaType: input.mediaType,
      tmdbId: input.tmdbId,
      seasonNumber: input.mediaType === "tv" ? input.seasonNumber : null,
      episodeNumber: input.mediaType === "tv" ? input.episodeNumber : null,
      positionSeconds: input.positionSeconds,
      durationSeconds: input.durationSeconds ?? null,
    });
    return { ok: true, message: "Saved." };
  } catch (error) {
    logError("watch-progress/save-action", error);
    return { ok: false, message: toUserMessage(error) };
  }
}
