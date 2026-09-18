import "server-only";

import { STATIC_CLOUDFLARE_ENV } from "@/lib/config/cloudflare-static-env.generated";

function str(value: string | undefined, fallback = ""): string {
  return value && value.trim() !== "" ? value.trim() : fallback;
}

/**
 * Server/runtime configuration.
 *
 * process.env is preferred so normal local/Cloudflare bindings continue to
 * work. The generated static fallback is produced from .env.cloudflare by
 * scripts/cf-build.mjs, allowing the GitHub -> Cloudflare build flow to work
 * without editing Cloudflare Dashboard variables.
 */
export const serverEnv = {
  get tmdbToken() {
    return str(process.env.TMDB_TOKEN, STATIC_CLOUDFLARE_ENV.TMDB_TOKEN);
  },
  get tmdbApiKey() {
    return str(process.env.TMDB_API_KEY, STATIC_CLOUDFLARE_ENV.TMDB_API_KEY);
  },
  get tmdbBaseUrl() {
    return str(
      process.env.TMDB_API_BASE_URL,
      STATIC_CLOUDFLARE_ENV.TMDB_API_BASE_URL || "https://api.themoviedb.org/3",
    );
  },
  get tmdbLanguage() {
    return str(process.env.TMDB_LANGUAGE, STATIC_CLOUDFLARE_ENV.TMDB_LANGUAGE || "en-US");
  },
  get tmdbRegion() {
    return str(process.env.TMDB_REGION, STATIC_CLOUDFLARE_ENV.TMDB_REGION || "US");
  },
  get supabaseServiceRoleKey() {
    return str(
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      STATIC_CLOUDFLARE_ENV.SUPABASE_SERVICE_ROLE_KEY,
    );
  },
  get adProviderTag() {
    return str(process.env.AD_PROVIDER_TAG, STATIC_CLOUDFLARE_ENV.AD_PROVIDER_TAG);
  },
} as const;

export function isTmdbConfigured(): boolean {
  return serverEnv.tmdbToken !== "" || serverEnv.tmdbApiKey !== "";
}
