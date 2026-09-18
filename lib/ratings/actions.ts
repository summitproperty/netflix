"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { logError, toUserMessage } from "@/lib/utils/errors";
import { clearRating, getRating, setRating, type RatingValue } from "@/services/ratings.service";
import type { MediaType } from "@/types/tmdb";

export interface RatingActionResult {
  ok: boolean;
  rating: RatingValue | null;
  message: string;
  requiresAuth?: boolean;
}

function validate(mediaType: MediaType, tmdbId: number): string | null {
  if (mediaType !== "movie" && mediaType !== "tv") return "Unsupported media type.";
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) return "Invalid title id.";
  return null;
}

/**
 * Sets a like/dislike. Clicking the currently-active choice again clears the
 * rating instead of re-saving it (a real toggle, same as MyListButton).
 */
export async function setRatingAction(
  mediaType: MediaType,
  tmdbId: number,
  value: RatingValue,
  detailPath: string,
): Promise<RatingActionResult> {
  const invalid = validate(mediaType, tmdbId);
  if (invalid) return { ok: false, rating: null, message: invalid };

  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      rating: null,
      requiresAuth: true,
      message: "Sign in to rate titles.",
    };
  }

  try {
    const current = await getRating(user.id, mediaType, tmdbId);
    const next = current === value ? null : value;

    if (next === null) {
      await clearRating(user.id, mediaType, tmdbId);
    } else {
      await setRating(user.id, mediaType, tmdbId, next);
    }

    revalidatePath(detailPath);
    return {
      ok: true,
      rating: next,
      message:
        next === null ? "Rating removed." : next === 1 ? "Marked as liked." : "Marked as disliked.",
    };
  } catch (error) {
    logError("ratings/set-action", error);
    return { ok: false, rating: null, message: toUserMessage(error) };
  }
}
