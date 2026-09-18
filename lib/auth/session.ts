import "server-only";

import { redirect } from "next/navigation";

import { getSupabaseServerClientOrNull } from "@/lib/supabase/server";
import { logError } from "@/lib/utils/errors";
import type { ProfileRow } from "@/types/database";

/** Everything the UI needs about the signed-in viewer. */
export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  provider: string;
}

function displayNameFrom(
  metadata: Record<string, unknown> | undefined,
  email: string,
): string {
  const candidates = [
    metadata?.display_name,
    metadata?.full_name,
    metadata?.name,
  ].filter((value): value is string => typeof value === "string" && value.trim() !== "");

  if (candidates.length > 0) return candidates[0].trim();
  const localPart = email.split("@")[0] ?? "Viewer";
  return localPart.charAt(0).toUpperCase() + localPart.slice(1);
}

/**
 * Current viewer, or null when signed out / Supabase not configured.
 * Uses getUser() so the token is verified rather than read from a cookie.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await getSupabaseServerClientOrNull();
  if (!supabase) return null;

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;

    const email = user.email ?? "";
    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
    const avatar =
      typeof metadata.avatar_url === "string" ? metadata.avatar_url : null;

    return {
      id: user.id,
      email,
      displayName: displayNameFrom(metadata, email),
      avatarUrl: avatar,
      provider: user.app_metadata?.provider ?? "email",
    };
  } catch (error) {
    logError("auth/getCurrentUser", error);
    return null;
  }
}

/**
 * Guard for protected pages. Middleware normally redirects first; this is the
 * defence in depth for direct/edge cases and for Server Actions.
 */
export async function requireUser(redirectTo: string): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`);
  }
  return user;
}

/**
 * Profile row for the current user, created lazily if the signup trigger
 * missed it (e.g. a user created before the trigger existed). Reads first;
 * only inserts on the rare miss, so this stays a cheap single query in the
 * normal case.
 */
export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const supabase = await getSupabaseServerClientOrNull();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle()
    .overrideTypes<ProfileRow, { merge: false }>();

  if (error) {
    logError("auth/getProfile", error);
    return null;
  }
  if (data) return data;

  // Self-heal: the row is genuinely missing (trigger miss / pre-existing
  // user). `insert` here is intentionally not an upsert — if another request
  // won the race and inserted first, this one fails on the primary key and
  // we just re-read below, rather than silently overwriting real data.
  const user = await getCurrentUser();
  const email = user?.id === userId ? user.email : "";
  const fallbackName = email.split("@")[0] || "Viewer";

  const { error: insertError } = await supabase
    .from("profiles")
    .insert({ id: userId, display_name: fallbackName });

  if (insertError && insertError.code !== "23505") {
    // 23505 = unique_violation, i.e. lost the race to another concurrent
    // self-heal or the trigger — not a real failure.
    logError("auth/getProfile/self-heal", insertError);
  }

  const { data: healed, error: rereadError } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle()
    .overrideTypes<ProfileRow, { merge: false }>();

  if (rereadError) {
    logError("auth/getProfile/reread", rereadError);
    return null;
  }
  return healed ?? null;
}
