import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { isSupabaseConfigured, publicEnv } from "@/lib/config/env";
import { serverEnv } from "@/lib/config/server-env";
import { AppError } from "@/lib/utils/errors";
import type { Database } from "@/types/database";

/**
 * Server-side Supabase clients for Server Components, Server Actions and Route
 * Handlers. Cookie writes are wrapped in try/catch because Server Components
 * are not allowed to mutate cookies - the middleware refresh handles that case.
 */

export async function getSupabaseServerClientOrNull(): Promise<SupabaseClient<Database> | null> {
  if (!isSupabaseConfigured) return null;

  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component render: safe to ignore.
          }
        },
      },
    },
  );
}

/** Same as above but throws a typed config error when Supabase is missing. */
export async function requireSupabaseServerClient(): Promise<SupabaseClient<Database>> {
  const client = await getSupabaseServerClientOrNull();
  if (!client) {
    throw new AppError(
      "config",
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      503,
    );
  }
  return client;
}

/**
 * Service-role client. Bypasses RLS, so only use it for trusted server-side
 * maintenance (never in response to unauthenticated input).
 */
export function getSupabaseAdminClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured || serverEnv.supabaseServiceRoleKey === "") return null;

  return createServerClient<Database>(
    publicEnv.supabaseUrl,
    serverEnv.supabaseServiceRoleKey,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          /* no session persistence for admin operations */
        },
      },
    },
  );
}
