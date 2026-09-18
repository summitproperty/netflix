"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { getSiteUrl } from "@/lib/config/site";
import { requireSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { logError } from "@/lib/utils/errors";
import {
  EMAIL_PATTERN,
  MIN_PASSWORD_LENGTH,
  formError as error,
  formSuccess as success,
  safeRedirectPath,
  type FormState,
} from "@/lib/auth/form-state";

/**
 * Auth server actions. All of them return a serializable FormState so client
 * forms can render inline errors with useActionState.
 */

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Hosts we are willing to trust from the request's own `Host` header. */
const LOOPBACK_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

/**
 * Origin for auth emails and OAuth callbacks.
 *
 * `getSiteUrl()` already prefers `NEXT_PUBLIC_SITE_URL` and then the
 * Vercel-provided URL, so the only time we reach the request headers is local
 * development. The `Host` header is attacker-controlled, so it is accepted for
 * loopback hosts only — otherwise a spoofed Host could point a password-reset
 * email at someone else's domain.
 */
async function resolveOrigin(): Promise<string> {
  const configured = getSiteUrl();
  if (!configured.includes("localhost")) return configured;
  try {
    const headerList = await headers();
    const host = headerList.get("host");
    if (host && LOOPBACK_HOST.test(host)) {
      return `http://${host}`;
    }
  } catch {
    /* headers() unavailable: fall through */
  }
  return configured;
}

function friendlyAuthError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) {
    return "That email and password combination did not match an account.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Please confirm your email address first, then sign in.";
  }
  if (normalized.includes("user already registered") || normalized.includes("already been registered")) {
    return "An account with that email already exists. Try signing in instead.";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  if (normalized.includes("password")) return message;
  return "We could not complete that request. Please try again.";
}

/* --------------------------------- sign up -------------------------------- */

export async function signUpAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = readString(formData, "email");
  const password = readString(formData, "password");
  const confirmPassword = readString(formData, "confirmPassword");
  const displayName = readString(formData, "displayName");
  const target = safeRedirectPath(readString(formData, "redirect") || null, "/dashboard");

  const fieldErrors: Record<string, string> = {};
  if (!EMAIL_PATTERN.test(email)) fieldErrors.email = "Enter a valid email address.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    fieldErrors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (confirmPassword !== password) {
    fieldErrors.confirmPassword = "Passwords do not match.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return error("Please fix the highlighted fields.", fieldErrors);
  }

  let needsEmailVerification = false;

  try {
    const supabase = await requireSupabaseServerClient();

    const origin = await resolveOrigin();
    const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(target)}`;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: displayName ? { display_name: displayName } : undefined,
        emailRedirectTo,
      },
    });

    if (signUpError) return error(friendlyAuthError(signUpError.message));

    // When email confirmation is required, Supabase returns no session.
    // The confirmation email will return to our server callback, which verifies
    // the link and establishes the session before redirecting to the dashboard.
    needsEmailVerification = !data.session;
  } catch (caught) {
    logError("auth/signUp", caught);
    return error("Sign up is unavailable right now. Please try again later.");
  }

  revalidatePath("/", "layout");

  // Keep Next.js redirect() outside the try/catch. redirect() intentionally
  // throws a framework control-flow signal; catching it would turn a
  // successful signup into a generic error state.
  if (needsEmailVerification) {
    redirect(`/verify-email?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(target)}`);
  }

  redirect(target);
}

/* ---------------------------- email OTP verify ---------------------------- */

export async function verifyEmailOtpAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = readString(formData, "email");
  const token = readString(formData, "token").replace(/\D/g, "").slice(0, 6);
  const target = safeRedirectPath(readString(formData, "redirect") || null, "/dashboard");

  const fieldErrors: Record<string, string> = {};
  if (!EMAIL_PATTERN.test(email)) fieldErrors.email = "Enter a valid email address.";
  if (!/^\d{6}$/.test(token)) fieldErrors.token = "Enter the 6-digit code from your email.";
  if (Object.keys(fieldErrors).length > 0) {
    return error("Please enter the 6-digit verification code.", fieldErrors);
  }

  try {
    const supabase = await requireSupabaseServerClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup",
    });

    if (verifyError) {
      const message = verifyError.message.toLowerCase();
      if (message.includes("expired") || message.includes("invalid")) {
        return error("That verification code is invalid or expired. Request a new code and try again.");
      }
      return error(friendlyAuthError(verifyError.message));
    }
  } catch (caught) {
    logError("auth/verifyEmailOtp", caught);
    return error("We could not verify your email right now. Please try again.");
  }

  revalidatePath("/", "layout");
  redirect(target);
}

export async function resendEmailConfirmationAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = readString(formData, "email");
  const target = safeRedirectPath(readString(formData, "redirect") || null, "/dashboard");

  if (!EMAIL_PATTERN.test(email)) {
    return error("Enter a valid email address.", {
      email: "Enter a valid email address.",
    });
  }

  try {
    const supabase = await requireSupabaseServerClient();
    const origin = await resolveOrigin();
    const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(target)}`;

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo },
    });

    if (resendError) {
      return error(friendlyAuthError(resendError.message));
    }
  } catch (caught) {
    logError("auth/resendEmailConfirmation", caught);
    return error("We could not send a new confirmation email right now. Please try again.");
  }

  return success("A new confirmation email has been sent.");
}

/* --------------------------------- sign in -------------------------------- */

export async function signInAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = readString(formData, "email");
  const password = readString(formData, "password");
  const target = safeRedirectPath(readString(formData, "redirect") || null);

  const fieldErrors: Record<string, string> = {};
  if (!EMAIL_PATTERN.test(email)) fieldErrors.email = "Enter a valid email address.";
  if (password.length === 0) fieldErrors.password = "Enter your password.";
  if (Object.keys(fieldErrors).length > 0) {
    return error("Please fix the highlighted fields.", fieldErrors);
  }

  try {
    const supabase = await requireSupabaseServerClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) return error(friendlyAuthError(signInError.message));
  } catch (caught) {
    logError("auth/signIn", caught);
    return error("Sign in is unavailable right now. Please try again later.");
  }

  revalidatePath("/", "layout");
  redirect(target);
}

/* ------------------------------ Google OAuth ------------------------------ */

/**
 * Starts the Google OAuth flow. Configure the client id/secret inside
 * Supabase -> Authentication -> Providers -> Google; this action only asks
 * Supabase for the consent URL and forwards the visitor to it.
 */
export async function signInWithGoogleAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const target = safeRedirectPath(readString(formData, "redirect") || null, "/dashboard");
  let consentUrl = "";

  try {
    const supabase = await requireSupabaseServerClient();
    const origin = await resolveOrigin();

    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(target)}`,
        skipBrowserRedirect: true,
      },
    });

    if (oauthError || !data?.url) {
      return error(
        "Google sign-in is not available. Check that the Google provider is enabled in Supabase.",
      );
    }
    consentUrl = data.url;
  } catch (caught) {
    logError("auth/google", caught);
    return error("Google sign-in is unavailable right now.");
  }

  redirect(consentUrl);
}

/* -------------------------------- sign out -------------------------------- */

export async function signOutAction(): Promise<void> {
  try {
    const supabase = await requireSupabaseServerClient();
    await supabase.auth.signOut();
  } catch (caught) {
    logError("auth/signOut", caught);
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/* ----------------------------- password reset ----------------------------- */

export async function requestPasswordResetAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = readString(formData, "email");
  if (!EMAIL_PATTERN.test(email)) {
    return error("Enter a valid email address.", {
      email: "Enter a valid email address.",
    });
  }

  try {
    const supabase = await requireSupabaseServerClient();
    const origin = await resolveOrigin();

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
    });

    // Never reveal whether an address is registered.
    if (resetError) logError("auth/resetRequest", resetError);
  } catch (caught) {
    logError("auth/resetRequest", caught);
  }

  return success(
    "If an account exists for that address, a password reset link is on its way.",
  );
}

export async function updatePasswordAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const password = readString(formData, "password");
  const confirmPassword = readString(formData, "confirmPassword");

  const fieldErrors: Record<string, string> = {};
  if (password.length < MIN_PASSWORD_LENGTH) {
    fieldErrors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (confirmPassword !== password) {
    fieldErrors.confirmPassword = "Passwords do not match.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return error("Please fix the highlighted fields.", fieldErrors);
  }

  try {
    const supabase = await requireSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return error(
        "This reset link is no longer valid. Request a new one from the forgot password page.",
      );
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) return error(friendlyAuthError(updateError.message));
  } catch (caught) {
    logError("auth/updatePassword", caught);
    return error("We could not update your password. Please try again.");
  }

  revalidatePath("/", "layout");
  return success("Password updated. You can now use it to sign in.");
}

/* --------------------------------- profile -------------------------------- */

export async function updateProfileAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const displayName = readString(formData, "displayName").slice(0, 60);
  const avatarUrlRaw = readString(formData, "avatarUrl").slice(0, 2048);

  if (displayName.length < 2) {
    return error("Display name is too short.", {
      displayName: "Use at least 2 characters.",
    });
  }

  let avatarUrl: string | null = null;
  if (avatarUrlRaw !== "") {
    try {
      const parsed = new URL(avatarUrlRaw);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        return error("Avatar URL must be a web link.", {
          avatarUrl: "Use an https:// image link.",
        });
      }
      avatarUrl = parsed.toString();
    } catch {
      return error("That avatar URL doesn't look valid.", {
        avatarUrl: "Enter a full https:// image link.",
      });
    }
  }

  try {
    const user = await getCurrentUser();
    if (!user) return error("Please sign in again to update your profile.");

    const supabase = await requireSupabaseServerClient();

    const { error: metadataError } = await supabase.auth.updateUser({
      data: { display_name: displayName, avatar_url: avatarUrl },
    });
    if (metadataError) return error(friendlyAuthError(metadataError.message));

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          display_name: displayName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
    if (profileError) {
      logError("auth/updateProfile", profileError);
      return error("Your name was updated, but saving the profile row failed.");
    }
  } catch (caught) {
    logError("auth/updateProfile", caught);
    return error("We could not update your profile. Please try again.");
  }

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return success("Profile updated.");
}
