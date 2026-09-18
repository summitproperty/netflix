"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/SubmitButton";
import { GoogleIcon } from "@/components/ui/Icons";
import { signInWithGoogleAction } from "@/lib/auth/actions";
import { initialFormState } from "@/lib/auth/form-state";

interface GoogleButtonProps {
  /** Path to return to after the consent screen. */
  redirectTo?: string;
}

/**
 * Google sign-in button. Visibility is controlled by the auth form; it defaults to
 * true; the client id/secret live in Supabase, never in this codebase.
 */
export function GoogleButton({ redirectTo = "/" }: GoogleButtonProps) {
  const [state, formAction] = useActionState(signInWithGoogleAction, initialFormState);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="redirect" value={redirectTo} />
      <SubmitButton variant="secondary" pendingLabel="Opening Google">
        <GoogleIcon width={17} height={17} />
        Continue with Google
      </SubmitButton>
      {state.status === "error" ? (
        <p role="alert" className="text-xs text-brand-hover">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export default GoogleButton;
