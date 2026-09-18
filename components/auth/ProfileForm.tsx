"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/SubmitButton";
import { AlertIcon, CheckIcon } from "@/components/ui/Icons";
import { updateProfileAction } from "@/lib/auth/actions";
import { initialFormState } from "@/lib/auth/form-state";
import { cn } from "@/lib/utils/cn";

interface ProfileFormProps {
  displayName: string;
  avatarUrl: string | null;
  email: string;
  /** "email", "google", ... - shown read-only so people know how they signed up. */
  provider: string;
}

/** Display-name/avatar editor on /profile. Email and provider are read-only. */
export function ProfileForm({ displayName, avatarUrl, email, provider }: ProfileFormProps) {
  const [state, formAction] = useActionState(updateProfileAction, initialFormState);
  const error = state.fieldErrors?.displayName;
  const avatarError = state.fieldErrors?.avatarUrl;

  return (
    <form action={formAction} className="space-y-4">
      {state.status !== "idle" && state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={cn(
            "flex items-start gap-2 rounded-lg border px-3 py-2 text-xs leading-relaxed",
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

      <div>
        <label
          htmlFor="displayName"
          className="mb-1.5 block text-xs font-semibold text-mist-300"
        >
          Display name
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          defaultValue={displayName}
          maxLength={60}
          required
          autoComplete="name"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "displayName-error" : undefined}
          className={cn("field", error && "!border-brand")}
        />
        {error ? (
          <p id="displayName-error" className="mt-1 text-xs text-brand-hover">
            {error}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="profile-email" className="mb-1.5 block text-xs font-semibold text-mist-300">
          Email address
        </label>
        <input
          id="profile-email"
          type="email"
          value={email}
          readOnly
          disabled
          className="field cursor-not-allowed opacity-70"
        />
        <p className="mt-1 text-xs text-mist-500">
          Signed in with {provider === "email" ? "email and password" : provider}.
        </p>
      </div>

      <div>
        <label
          htmlFor="avatarUrl"
          className="mb-1.5 block text-xs font-semibold text-mist-300"
        >
          Avatar URL
        </label>
        <input
          id="avatarUrl"
          name="avatarUrl"
          type="url"
          defaultValue={avatarUrl ?? ""}
          maxLength={2048}
          placeholder="https://example.com/avatar.jpg"
          autoComplete="off"
          aria-invalid={avatarError ? true : undefined}
          aria-describedby={avatarError ? "avatarUrl-error" : undefined}
          className={cn("field", avatarError && "!border-brand")}
        />
        {avatarError ? (
          <p id="avatarUrl-error" className="mt-1 text-xs text-brand-hover">
            {avatarError}
          </p>
        ) : (
          <p className="mt-1 text-xs text-mist-500">
            Leave blank to use your account&apos;s default avatar.
          </p>
        )}
      </div>

      <SubmitButton pendingLabel="Saving">Save changes</SubmitButton>
    </form>
  );
}

export default ProfileForm;
