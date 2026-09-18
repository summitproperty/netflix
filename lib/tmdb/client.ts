import "server-only";

import { isTmdbConfigured } from "@/lib/config/server-env";
import { serverEnv } from "@/lib/config/server-env";
import { AppError, TMDBError, logError } from "@/lib/utils/errors";

/**
 * Server-only TMDB HTTP client.
 *
 * `import "server-only"` makes the build fail if a client component ever
 * imports this file, which is what keeps TMDB_TOKEN out of the browser bundle.
 * Client-side code talks to /api/media/* instead (see app/api/media).
 */

/** Cache windows (seconds) tuned per volatility of the data. */
export const REVALIDATE = {
  /** Trending / now playing: changes through the day. */
  short: 60 * 30,
  /** Discover lists, popular, top rated. */
  medium: 60 * 60 * 6,
  /** Title details, credits, seasons: effectively static. */
  long: 60 * 60 * 24,
  /** Configuration-like data. */
  week: 60 * 60 * 24 * 7,
} as const;

const REQUEST_TIMEOUT_MS = 10_000;

export type QueryValue = string | number | boolean | undefined | null;

export interface TmdbRequestOptions {
  params?: Record<string, QueryValue>;
  /** ISR window in seconds. Pass 0 to opt out of caching. */
  revalidate?: number;
  /** Cache tags, so a webhook could purge selectively later. */
  tags?: string[];
}

function buildUrl(path: string, params: Record<string, QueryValue> = {}): URL {
  const base = serverEnv.tmdbBaseUrl.replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${suffix}`);

  if (!url.searchParams.has("language")) {
    url.searchParams.set("language", serverEnv.tmdbLanguage);
  }

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }

  // v3 key only when no v4 bearer token is configured.
  if (!serverEnv.tmdbToken && serverEnv.tmdbApiKey) {
    url.searchParams.set("api_key", serverEnv.tmdbApiKey);
  }

  return url;
}

function authHeaders(): HeadersInit {
  const headers: Record<string, string> = { accept: "application/json" };
  if (serverEnv.tmdbToken) {
    headers.Authorization = `Bearer ${serverEnv.tmdbToken}`;
  }
  return headers;
}

/** Strip credentials before anything is logged. */
function safePath(url: URL): string {
  const copy = new URL(url.toString());
  copy.searchParams.delete("api_key");
  return `${copy.pathname}${copy.search}`;
}

export async function tmdbFetch<T>(
  path: string,
  options: TmdbRequestOptions = {},
): Promise<T> {
  if (!isTmdbConfigured()) {
    throw new AppError(
      "config",
      "TMDB credentials are missing. Set TMDB_TOKEN (or TMDB_API_KEY) in your environment.",
      503,
    );
  }

  const url = buildUrl(path, options.params);
  const revalidate = options.revalidate ?? REVALIDATE.medium;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: authHeaders(),
      signal: controller.signal,
      next: revalidate > 0 ? { revalidate, tags: options.tags } : undefined,
      cache: revalidate > 0 ? undefined : "no-store",
    });

    if (response.status === 404) {
      throw new TMDBError(`TMDB resource not found: ${safePath(url)}`, 404);
    }

    if (response.status === 401 || response.status === 403) {
      throw new TMDBError("TMDB rejected the configured credentials.", 502);
    }

    if (response.status === 429) {
      throw new TMDBError("TMDB rate limit reached. Please retry shortly.", 429);
    }

    if (!response.ok) {
      throw new TMDBError(
        `TMDB request failed (${response.status}) for ${safePath(url)}`,
        502,
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new AppError("network", "TMDB request timed out.", 504);
    }
    throw new AppError("network", "Could not reach TMDB.", 502);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetch that degrades instead of throwing. Used for optional homepage rails so
 * one failing category cannot take down the whole page.
 */
export async function tmdbFetchSafe<T>(
  path: string,
  options: TmdbRequestOptions = {},
  scope = "tmdb",
): Promise<T | null> {
  try {
    return await tmdbFetch<T>(path, options);
  } catch (error) {
    logError(scope, error);
    return null;
  }
}
