import "server-only";

import { AppError, logError } from "@/lib/utils/errors";
import { requireSupabaseServerClient } from "@/lib/supabase/server";
import type { SearchHistoryRow } from "@/types/database";

/**
 * Recent search queries per user, stored server-side (not localStorage) so
 * the same list follows the account across devices — same reasoning as
 * watch_progress/my_list.
 */

const MAX_STORED_PER_USER = 20;
const DEFAULT_LIST_LIMIT = 8;

export interface SearchHistoryEntry {
  id: string;
  query: string;
  createdAt: string;
}

function toEntry(row: Pick<SearchHistoryRow, "id" | "query" | "created_at">): SearchHistoryEntry {
  return { id: row.id, query: row.query, createdAt: row.created_at };
}

/**
 * Records one search. A repeat of the same query (case-insensitive) bumps
 * its timestamp instead of creating a duplicate row, so the recent-searches
 * list stays a list of distinct queries. Also prunes anything beyond the
 * newest MAX_STORED_PER_USER rows for this user, so the table can't grow
 * without bound.
 */
export async function recordSearch(userId: string, query: string): Promise<void> {
  const trimmed = query.trim().slice(0, 120);
  if (trimmed === "") return;

  const supabase = await requireSupabaseServerClient();

  const { data: existing, error: lookupError } = await supabase
    .from("search_history")
    .select("id")
    .eq("user_id", userId)
    .ilike("query", trimmed)
    .maybeSingle();

  if (lookupError) {
    logError("search-history/lookup", lookupError);
    throw new AppError("database", "Could not save your search.", 500);
  }

  const now = new Date().toISOString();
  const { error } = existing
    ? await supabase
        .from("search_history")
        .update({ query: trimmed, created_at: now })
        .eq("id", existing.id)
    : await supabase.from("search_history").insert({ user_id: userId, query: trimmed });

  if (error) {
    logError("search-history/record", error);
    throw new AppError("database", "Could not save your search.", 500);
  }

  // Prune beyond the retention cap. A small, infrequent extra query — search
  // saves are already the least frequent write in the app.
  const { data: overflow, error: overflowError } = await supabase
    .from("search_history")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(MAX_STORED_PER_USER, MAX_STORED_PER_USER + 50);

  if (!overflowError && overflow && overflow.length > 0) {
    await supabase
      .from("search_history")
      .delete()
      .in(
        "id",
        overflow.map((row) => row.id),
      );
  }
}

export async function getSearchHistory(
  userId: string,
  limit: number = DEFAULT_LIST_LIMIT,
): Promise<SearchHistoryEntry[]> {
  const supabase = await requireSupabaseServerClient();
  const { data, error } = await supabase
    .from("search_history")
    .select("id, query, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logError("search-history/list", error);
    return [];
  }
  return (data ?? []).map(toEntry);
}

export async function removeSearchHistoryEntry(userId: string, id: string): Promise<void> {
  const supabase = await requireSupabaseServerClient();
  const { error } = await supabase
    .from("search_history")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);

  if (error) {
    logError("search-history/remove", error);
    throw new AppError("database", "Could not remove that search.", 500);
  }
}

export async function clearSearchHistory(userId: string): Promise<void> {
  const supabase = await requireSupabaseServerClient();
  const { error } = await supabase.from("search_history").delete().eq("user_id", userId);

  if (error) {
    logError("search-history/clear", error);
    throw new AppError("database", "Could not clear your search history.", 500);
  }
}
