"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import {
  addToMyList,
  isInMyList,
  removeFromMyList,
} from "@/services/mylist.service";
import { logError, toUserMessage } from "@/lib/utils/errors";
import type { MediaType } from "@/types/tmdb";

/** Result contract for the optimistic My List button. */
export interface MyListActionResult {
  ok: boolean;
  inList: boolean;
  message: string;
  /** Set when the visitor must sign in first. */
  requiresAuth?: boolean;
}

export interface ToggleMyListInput {
  mediaType: MediaType;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  voteAverage: number | null;
}

function validate(input: ToggleMyListInput): string | null {
  if (input.mediaType !== "movie" && input.mediaType !== "tv") {
    return "Unsupported media type.";
  }
  if (!Number.isInteger(input.tmdbId) || input.tmdbId <= 0) {
    return "Invalid title id.";
  }
  if (typeof input.title !== "string" || input.title.trim() === "") {
    return "Missing title.";
  }
  return null;
}

/** Adds when absent, removes when present. */
export async function toggleMyListAction(
  input: ToggleMyListInput,
): Promise<MyListActionResult> {
  const invalid = validate(input);
  if (invalid) {
    return { ok: false, inList: false, message: invalid };
  }

  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      inList: false,
      requiresAuth: true,
      message: "Sign in to build your list.",
    };
  }

  try {
    const present = await isInMyList(user.id, input.mediaType, input.tmdbId);

    if (present) {
      await removeFromMyList(user.id, input.mediaType, input.tmdbId);
    } else {
      await addToMyList(user.id, {
        mediaType: input.mediaType,
        tmdbId: input.tmdbId,
        title: input.title,
        posterPath: input.posterPath,
        backdropPath: input.backdropPath,
        releaseDate: input.releaseDate,
        voteAverage: input.voteAverage,
      });
    }

    revalidatePath("/my-list");

    return {
      ok: true,
      inList: !present,
      message: present ? "Removed from My List." : "Added to My List.",
    };
  } catch (error) {
    logError("mylist/toggle", error);
    return { ok: false, inList: false, message: toUserMessage(error) };
  }
}

/** Explicit removal, used by the My List page. */
export async function removeFromMyListAction(
  mediaType: MediaType,
  tmdbId: number,
): Promise<MyListActionResult> {
  // Server actions are a public HTTP surface, so the arguments are validated
  // here too rather than trusting the caller's types.
  if (mediaType !== "movie" && mediaType !== "tv") {
    return { ok: false, inList: true, message: "Unsupported media type." };
  }
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
    return { ok: false, inList: true, message: "Invalid title id." };
  }

  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      inList: false,
      requiresAuth: true,
      message: "Please sign in again.",
    };
  }

  try {
    await removeFromMyList(user.id, mediaType, tmdbId);
    revalidatePath("/my-list");
    return { ok: true, inList: false, message: "Removed from My List." };
  } catch (error) {
    logError("mylist/remove-action", error);
    return { ok: false, inList: true, message: toUserMessage(error) };
  }
}
