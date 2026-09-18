import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { getSupabaseServerClientOrNull } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/auth/form-state";
import { logError } from "@/lib/utils/errors";

/**
 * Auth callback for OAuth (?code=...) and email links (?token_hash=&type=).
 * Exchanges the one-time credential for a session cookie, then forwards the
 * visitor to `next` (validated to be a same-origin path).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = safeRedirectPath(url.searchParams.get("next"), "/dashboard");
  const errorDescription = url.searchParams.get("error_description");

  const failure = (reason: string) =>
    NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(reason)}`, url.origin));

  if (errorDescription) {
    return failure(errorDescription.slice(0, 160));
  }

  const supabase = await getSupabaseServerClientOrNull();
  if (!supabase) {
    return failure("Authentication is not configured yet.");
  }

  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) return failure("That sign-in link has expired. Please try again.");
      return NextResponse.redirect(new URL(next, url.origin));
    }

    if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      if (error) return failure("That link has expired. Please request a new one.");
      return NextResponse.redirect(new URL(next, url.origin));
    }
  } catch (error) {
    logError("auth/callback", error);
    return failure("We could not complete sign-in. Please try again.");
  }

  return failure("Missing authentication code.");
}
