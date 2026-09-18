import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { safeRedirectPath } from "@/lib/auth/form-state";
import { isSupabaseConfigured, publicEnv } from "@/lib/config/env";
import type { Database } from "@/types/database";

/**
 * Session refresh + route protection for middleware.
 *
 * Supabase access tokens are short lived; refreshing them here keeps Server
 * Components from seeing an expired session, and writes the rotated cookies
 * onto the outgoing response.
 */

/** Prefixes that require an authenticated session. */
export const PROTECTED_PREFIXES = ["/dashboard", "/watch", "/my-list", "/profile"] as const;

/** Signed-in users are bounced away from these. */
const AUTH_ONLY_PREFIXES = ["/login", "/signup", "/forgot-password"] as const;

function matches(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Redirect while preserving any session cookies Supabase just rotated.
 *
 * `NextResponse.redirect()` starts from an empty cookie jar, so returning one
 * directly would throw away the refreshed access/refresh tokens written onto
 * `carrier` by the `setAll` callback below — the visitor would be signed out
 * on the very request that renewed their session.
 */
function redirectWith(carrier: NextResponse, url: URL): NextResponse {
  const redirect = NextResponse.redirect(url);
  for (const cookie of carrier.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  // Without Supabase configured we cannot authenticate anyone; send visitors to
  // the login page (which explains the missing configuration) rather than
  // silently exposing protected routes.
  if (!isSupabaseConfigured) {
    if (matches(request.nextUrl.pathname, PROTECTED_PREFIXES)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", `${request.nextUrl.pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(url);
    }
    return response;
  }

  const supabase = createServerClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Always use getUser() in middleware: it validates the JWT with Supabase
  // instead of trusting whatever is in the cookie. If Supabase is temporarily
  // unreachable, do not let that exception turn public pages into HTTP 500s.
  let user = null;
  try {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    user = currentUser;
  } catch (error) {
    console.error("Supabase middleware getUser failed:", error);
  }

  const { pathname } = request.nextUrl;

  if (!user && matches(pathname, PROTECTED_PREFIXES)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("redirect", `${pathname}${request.nextUrl.search}`);
    return redirectWith(response, url);
  }

  if (user && matches(pathname, AUTH_ONLY_PREFIXES)) {
    // Honour the pending intent: a visitor who signed in elsewhere and then
    // opened /login?redirect=/watch/... should land on the title, not the home
    // page. safeRedirectPath() rejects anything off-origin.
    const target = safeRedirectPath(request.nextUrl.searchParams.get("redirect"));
    return redirectWith(response, new URL(target, request.nextUrl.origin));
  }

  return response;
}
