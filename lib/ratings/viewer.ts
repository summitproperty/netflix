import "server-only";

import { getCurrentUser } from "@/lib/auth/session";
import { getRating, type RatingValue } from "@/services/ratings.service";
import { logError } from "@/lib/utils/errors";
import type { MediaType } from "@/types/tmdb";

/**
 * The current viewer's like/dislike for one title, or null for signed-out
 * visitors / no rating yet. Never throws — detail pages stay public and
 * keep rendering even if this lookup fails.
 */
export async function getViewerRating(
  mediaType: MediaType,
  tmdbId: number,
): Promise<RatingValue | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  try {
    return await getRating(user.id, mediaType, tmdbId);
  } catch (error) {
    logError("ratings/viewerRating", error);
    return null;
  }
}
