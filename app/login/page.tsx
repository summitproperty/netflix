import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/AuthForm";
import { getCurrentUser } from "@/lib/auth/session";
import { safeRedirectPath } from "@/lib/auth/form-state";
import { publicEnv } from "@/lib/config/env";

/*
 * /login — email + password, with the Google button enabled by default.
 * NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=false can explicitly hide it. `?redirect=` is sanitised through
 * safeRedirectPath() so it can only ever point at a path on this site.
 */

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to save titles to My List and start watching.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; notice?: string; error?: string }>;
}) {
  const { redirect: rawRedirect, notice, error } = await searchParams;
  const redirectTo = safeRedirectPath(rawRedirect, "/dashboard");

  const user = await getCurrentUser();
  if (user) redirect(redirectTo);

  // `error` is set by /auth/callback when a link expired; `notice` by the watch
  // gate. Both are plain text and rendered as a non-blocking banner.
  const message =
    error?.slice(0, 200) ??
    (notice === "watch"
      ? "Sign in to start watching. Browsing stays free."
      : undefined);

  return (
    <div className="page-shell flex min-h-[70vh] items-center justify-center">
      <AuthForm
        mode="login"
        redirectTo={redirectTo}
        googleEnabled={publicEnv.googleOAuthEnabled}
        notice={message}
      />
    </div>
  );
}
