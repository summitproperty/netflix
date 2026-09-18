"use client";

import Link from "next/link";
import { useActionState } from "react";

import { GoogleButton } from "@/components/auth/GoogleButton";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Logo } from "@/components/brand/Logo";
import { AlertIcon, CheckIcon } from "@/components/ui/Icons";
import {
  requestPasswordResetAction,
  signInAction,
  signUpAction,
  updatePasswordAction,
} from "@/lib/auth/actions";
import { initialFormState, MIN_PASSWORD_LENGTH, type FormState } from "@/lib/auth/form-state";
import { cn } from "@/lib/utils/cn";

export type AuthMode = "login" | "signup" | "forgot" | "reset";

interface AuthFormProps {
  mode: AuthMode;
  /** Where to send the visitor after a successful sign in. */
  redirectTo?: string;
  /** Google OAuth availability, resolved on the server from env. */
  googleEnabled?: boolean;
  /** Non-blocking notice, e.g. "Sign in to start watching". */
  notice?: string;
}

const COPY: Record<AuthMode, { title: string; subtitle: string; cta: string }> = {
  login: {
    title: "Sign in",
    subtitle: "Pick up where you left off and keep building your list.",
    cta: "Sign in",
  },
  signup: {
    title: "Create your account",
    subtitle: "Free to join. Save titles to My List and start watching in seconds.",
    cta: "Create account",
  },
  forgot: {
    title: "Reset your password",
    subtitle: "Enter your email and we will send you a secure reset link.",
    cta: "Send reset link",
  },
  reset: {
    title: "Choose a new password",
    subtitle: `Use at least ${MIN_PASSWORD_LENGTH} characters that you do not use elsewhere.`,
    cta: "Update password",
  },
};

const ACTIONS: Record<
  AuthMode,
  (state: FormState, formData: FormData) => Promise<FormState>
> = {
  login: signInAction,
  signup: signUpAction,
  forgot: requestPasswordResetAction,
  reset: updatePasswordAction,
};

/**
 * One form for all four auth flows. Each mode is backed by a server action that
 * returns a FormState, so validation errors render inline without losing input.
 */
export function AuthForm({
  mode,
  redirectTo = "/",
  googleEnabled = false,
  notice,
}: AuthFormProps) {
  const [state, formAction] = useActionState(ACTIONS[mode], initialFormState);
  const copy = COPY[mode];
  const fieldError = (name: string) => state.fieldErrors?.[name];

  return (
    <div className="card-surface w-full max-w-md p-6 shadow-card sm:p-8">
      <div className="mb-6 flex flex-col items-center text-center">
        <Logo variant="lockup" size={58} href={null} />
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">{copy.title}</h1>
        <p className="mt-1.5 text-sm text-mist-500">{copy.subtitle}</p>
      </div>

      {notice ? (
        <p className="mb-4 rounded-lg border border-gold/25 bg-gold/10 px-3 py-2 text-xs text-gold">
          {notice}
        </p>
      ) : null}

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

      <form action={formAction} className="space-y-4" noValidate>
        {mode === "login" || mode === "signup" ? (
          <input type="hidden" name="redirect" value={redirectTo} />
        ) : null}

        {mode === "signup" ? (
          <Field
            name="displayName"
            label="Display name"
            type="text"
            autoComplete="name"
            placeholder="How should we greet you?"
            error={fieldError("displayName")}
          />
        ) : null}

        {mode !== "reset" ? (
          <Field
            name="email"
            label="Email address"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            error={fieldError("email")}
          />
        ) : null}

        {mode !== "forgot" ? (
          <Field
            name="password"
            label={mode === "reset" ? "New password" : "Password"}
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            placeholder="••••••••"
            error={fieldError("password")}
            hint={mode === "login" ? undefined : `${MIN_PASSWORD_LENGTH} characters minimum`}
          />
        ) : null}

        {mode === "signup" || mode === "reset" ? (
          <Field
            name="confirmPassword"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            required
            placeholder="••••••••"
            error={fieldError("confirmPassword")}
          />
        ) : null}

        <SubmitButton>{copy.cta}</SubmitButton>
      </form>

      {mode === "login" || mode === "signup" ? (
        <>
          <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-mist-500">
            <span className="h-px flex-1 bg-white/10" />
            or
            <span className="h-px flex-1 bg-white/10" />
          </div>
          {googleEnabled ? <GoogleButton redirectTo={redirectTo} /> : null}

          <div className="mt-6 space-y-2 text-center text-sm text-mist-500">
            {mode === "login" ? (
              <>
                <p>
                  <Link href="/forgot-password" className="text-mist-300 hover:text-brand-hover">
                    Forgot your password?
                  </Link>
                </p>
                <p>
                  New here?{" "}
                  <Link href="/signup" className="font-semibold text-brand-hover hover:underline">
                    Create an account
                  </Link>
                </p>
              </>
            ) : (
              <p>
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-brand-hover hover:underline">
                  Sign in
                </Link>
              </p>
            )}
          </div>
        </>
      ) : (
        <p className="mt-6 text-center text-sm text-mist-500">
          <Link href="/login" className="text-mist-300 hover:text-brand-hover">
            Back to sign in
          </Link>
        </p>
      )}
    </div>
  );
}

interface FieldProps {
  name: string;
  label: string;
  type: string;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  hint?: string;
}

function Field({
  name,
  label,
  type,
  autoComplete,
  placeholder,
  required,
  error,
  hint,
}: FieldProps) {
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined;

  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs font-semibold text-mist-300">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn("field", error && "!border-brand")}
      />
      {error ? (
        <p id={`${name}-error`} className="mt-1 text-xs text-brand-hover">
          {error}
        </p>
      ) : hint ? (
        <p id={`${name}-hint`} className="mt-1 text-xs text-mist-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export default AuthForm;
