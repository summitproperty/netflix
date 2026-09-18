import { NextResponse } from "next/server";

import { clientKey, rateLimit } from "@/lib/utils/rate-limit";
import { isNotFound, logError, toUserMessage } from "@/lib/utils/errors";
import { getSeason } from "@/services/media.service";

/**
 * GET /api/media/tv/[id]/season/[season]
 * Lets the season switcher on a TV page load episodes without a full navigation.
 */

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; season: string }> },
) {
  const limit = rateLimit(clientKey(request, "season"), 120, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const { id, season } = await params;
  const tvId = Number(id);
  const seasonNumber = Number(season);

  if (!Number.isInteger(tvId) || tvId <= 0 || !Number.isInteger(seasonNumber) || seasonNumber < 0) {
    return NextResponse.json({ error: "Invalid series or season." }, { status: 400 });
  }

  try {
    const detail = await getSeason(tvId, seasonNumber);
    return NextResponse.json(detail, {
      headers: { "Cache-Control": "public, max-age=600, stale-while-revalidate=3600" },
    });
  } catch (error) {
    if (isNotFound(error)) {
      return NextResponse.json({ error: "Season not found." }, { status: 404 });
    }
    logError("api/media/season", error);
    return NextResponse.json({ error: toUserMessage(error) }, { status: 502 });
  }
}
