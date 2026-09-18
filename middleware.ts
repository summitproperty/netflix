import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Runs on every page request: refreshes the Supabase session cookie and gates
 * the protected routes (/watch, /my-list, /profile).
 */
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Everything except Next internals, the route handlers under /api and static
     * asset extensions.
     *
     * Route handlers are excluded on purpose: none of them are session-gated
     * (they proxy TMDB and the ad tag), so running a JWT validation round-trip
     * on every poster-rail fetch or ad request would only add latency. Server
     * actions POST to page routes, so they are still covered.
     */
    "/((?!_next/static|_next/image|api/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml|webmanifest)$).*)",
  ],
};
