import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { clientKey, rateLimit } from "@/lib/utils/rate-limit";
import { logError, toUserMessage } from "@/lib/utils/errors";
import { searchByType, searchMulti } from "@/services/media.service";
import { recordSearch } from "@/services/search-history.service";

/**
 * GET /api/media/search?q=inception&page=1&type=multi
 *
 * Public JSON endpoint used by the client-side search UI. TMDB credentials stay
 * on the server; only normalized results cross the wire.
 */

export const dynamic = "force-dynamic";

const MAX_QUERY_LENGTH = 120;

export async function GET(request: Request) {
  const limit = rateLimit(clientKey(request, "search"), 90, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many searches. Please slow down." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").slice(0, MAX_QUERY_LENGTH).trim();
  const pageParam = Number(url.searchParams.get("page") ?? "1");
  const page = Number.isInteger(pageParam) && pageParam > 0 ? Math.min(pageParam, 500) : 1;
  const type = url.searchParams.get("type") ?? "multi";

  if (query.length === 0) {
    return NextResponse.json(
      { page: 1, totalPages: 0, totalResults: 0, items: [] },
      { status: 200 },
    );
  }

  try {
    const results =
      type === "movie" || type === "tv"
        ? await searchByType(type, query, page)
        : await searchMulti(query, page);

    // Best-effort, signed-in-only, and only for the first page of a query —
    // paging through the same search must not spam the recent-searches list.
    // Awaited (not fire-and-forget) because this runs on Cloudflare Workers
    // via OpenNext, where a response can end the request before an
    // un-awaited promise finishes; recordSearchForViewer never throws, so
    // this can't turn a history-write hiccup into a broken search response.
    if (page === 1) {
      await recordSearchForViewer(query);
    }

    return NextResponse.json(results, {
      headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" },
    });
  } catch (error) {
    logError("api/media/search", error);
    return NextResponse.json({ error: toUserMessage(error) }, { status: 502 });
  }
}

async function recordSearchForViewer(query: string): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user) return;
    await recordSearch(user.id, query);
  } catch (error) {
    logError("api/media/search/history", error);
  }
}
