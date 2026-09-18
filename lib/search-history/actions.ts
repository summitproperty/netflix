"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { logError, toUserMessage } from "@/lib/utils/errors";
import { clearSearchHistory, removeSearchHistoryEntry } from "@/services/search-history.service";

export interface SearchHistoryActionResult {
  ok: boolean;
  message: string;
}

export async function removeSearchHistoryEntryAction(
  id: string,
): Promise<SearchHistoryActionResult> {
  if (typeof id !== "string" || id.trim() === "") {
    return { ok: false, message: "Invalid entry." };
  }

  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in again." };

  try {
    await removeSearchHistoryEntry(user.id, id);
    revalidatePath("/search");
    return { ok: true, message: "Removed." };
  } catch (error) {
    logError("search-history/remove-action", error);
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function clearSearchHistoryAction(): Promise<SearchHistoryActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in again." };

  try {
    await clearSearchHistory(user.id);
    revalidatePath("/search");
    return { ok: true, message: "Search history cleared." };
  } catch (error) {
    logError("search-history/clear-action", error);
    return { ok: false, message: toUserMessage(error) };
  }
}
