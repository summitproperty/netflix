import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/AuthForm";

/*
 * /forgot-password — sends a Supabase recovery email. The action always reports
 * success, so this page cannot be used to discover which emails are registered.
 */

export const metadata: Metadata = {
  title: "Reset password",
  description: "Request a secure password reset link for your account.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="page-shell flex min-h-[70vh] items-center justify-center">
      <AuthForm mode="forgot" />
    </div>
  );
}
