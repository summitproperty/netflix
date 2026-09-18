import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";
import { safeRedirectPath } from "@/lib/auth/form-state";

export const metadata: Metadata = {
  title: "Verify your email",
  description: "Confirm your email address to finish creating your account.",
  robots: { index: false, follow: false },
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; redirect?: string }>;
}) {
  const { email: rawEmail, redirect: rawRedirect } = await searchParams;
  const email = (rawEmail ?? "").trim();
  const redirectTo = safeRedirectPath(rawRedirect, "/dashboard");

  if (!email) redirect("/signup");

  return (
    <div className="page-shell flex min-h-[70vh] items-center justify-center">
      <VerifyEmailForm email={email} redirectTo={redirectTo} />
    </div>
  );
}
