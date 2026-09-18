import "server-only";

import { getCurrentUser } from "@/lib/auth/session";
import { getMyListKeys } from "@/services/mylist.service";
import { logError } from "@/lib/utils/errors";

/**
 * "movie-123" keys already saved by the current viewer, as a plain array that
 * can be handed to client components.
 *
 * Never throws: signed-out visitors and unconfigured Supabase projects simply
 * get an empty list, so browse pages keep rendering.
 */
export async function getViewerListKeys(): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  try {
    const keys = await getMyListKeys(user.id);
    return Array.from(keys);
  } catch (error) {
    logError("mylist/viewerKeys", error);
    return [];
  }
}

/** Convenience check used by detail pages. */
export function hasListKey(
  keys: string[],
  mediaType: "movie" | "tv",
  tmdbId: number,
): boolean {
  return keys.includes(`${mediaType}-${tmdbId}`);
}
