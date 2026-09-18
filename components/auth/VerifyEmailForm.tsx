"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Logo } from "@/components/brand/Logo";
import { SubmitButton } from "@/components/auth/SubmitButton";
import {
  resendEmailConfirmationAction,
} from "@/lib/auth/actions";
import { initialFormState } from "@/lib/auth/form-state";
import { AlertIcon, CheckIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/utils/cn";

export function VerifyEmailForm({
  email,
  redirectTo = "/dashboard",
}: {
  email: string;
  redirectTo?: string;
}) {
  const [resendState, resendAction] = useActionState(
    resendEmailConfirmationAction,
    initialFormState,
  );

  const state = resendState;

  return (
    <div className="card-surface w-full max-w-md p-6 shadow-card sm:p-8">
      <div className="mb-6 flex flex-col items-center text-center">
        <Logo variant="lockup" size={58} href={null} />
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">Verify your email</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-mist-500">
          We sent a confirmation link to
          <br />
          <span className="font-semibold text-mist-300">{email}</span>
        </p>
      </div>

      {state.status !== "idle" && state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={cn(
            "mb-4 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs leading-relaxed",
            state.status === "error"
              ? "border-brand/35 bg-brand/10 text-mist-100"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
          )}
        >
          <span className="mt-0.5 shrink-0">
            {state.status === "error" ? (
              <AlertIcon width={14} height={14} />
            ) : (
              <CheckIcon width={14} height={14} />
            )}
          </span>
          {state.message}
        </p>
      ) : null}

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-relaxed text-mist-300">
        <p>Open the confirmation link in the email to finish creating your account.</p>
        <p className="mt-2 text-mist-500">After confirmation, you will be signed in automatically and taken straight to your dashboard.</p>
      </div>

      <form action={resendAction} className="mt-4 space-y-3">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="redirect" value={redirectTo} />
        <SubmitButton variant="secondary" pendingLabel="Sending email">
          Resend confirmation email
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-mist-500">
        <Link href="/signup" className="text-mist-300 hover:text-brand-hover">
          Use a different email
        </Link>
      </p>
    </div>
  );
}

export default VerifyEmailForm;
