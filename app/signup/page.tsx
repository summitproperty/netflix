import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/AuthForm";
import { getCurrentUser } from "@/lib/auth/session";
import { safeRedirectPath } from "@/lib/auth/form-state";
import { publicEnv } from "@/lib/config/env";

/** /signup — create an account with email + password and Google sign-in. */

export const metadata: Metadata = {
  title: "Create account",
  description:
    "Create a free account to save titles to My List and stream instantly.",
  robots: { index: false, follow: false },
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect: rawRedirect } = await searchParams;
  const redirectTo = safeRedirectPath(rawRedirect, "/dashboard");

  const user = await getCurrentUser();
  if (user) redirect(redirectTo);

  return (
    <div className="page-shell flex min-h-[70vh] items-center justify-center">
      <AuthForm
        mode="signup"
        redirectTo={redirectTo}
        googleEnabled={publicEnv.googleOAuthEnabled}
      />
    </div>
  );
}
