"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { isSupabaseConfigured, publicEnv } from "@/lib/config/env";
import type { Database } from "@/types/database";

/**
 * Browser Supabase client (singleton).
 *
 * Uses the anon key, which is public by design; row level security in
 * supabase/schema.sql is what actually protects user data.
 */

let cached: SupabaseClient<Database> | null = null;

export function getSupabaseBrowserClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured) return null;
  if (cached) return cached;

  cached = createBrowserClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
  );
  return cached;
}
