import type { Metadata } from "next";
import Link from "next/link";

import { AuthForm } from "@/components/auth/AuthForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCurrentUser } from "@/lib/auth/session";

/*
 * /reset-password
 *
 * Reached from the recovery email, which points at
 * /auth/callback?token_hash=...&type=recovery&next=/reset-password. By the time
 * this page renders the callback has already established a session, so we can
 * simply check for a viewer: no session means the link expired or was reused.
 */

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Set a new password for your account.",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="page-shell flex min-h-[70vh] items-center justify-center">
        <EmptyState
          title="This reset link is no longer valid"
          message="Password reset links can only be used once and expire after a short time. Request a fresh link and we will email it right away."
          action={{ href: "/forgot-password", label: "Request a new link" }}
        />
      </div>
    );
  }

  return (
    <div className="page-shell flex min-h-[70vh] flex-col items-center justify-center gap-4">
      <AuthForm mode="reset" />
      <p className="text-xs text-mist-500">
        Changed your mind?{" "}
        <Link href="/profile" className="text-mist-100 underline-offset-2 hover:underline">
          Back to your profile
        </Link>
      </p>
    </div>
  );
}
