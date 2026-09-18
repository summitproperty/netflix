/**
 * Shared form-state contract for auth/profile server actions.
 *
 * Lives outside the "use server" module because those files may only export
 * async functions.
 */

export interface FormState {
  status: "idle" | "error" | "success";
  message: string;
  /** Field-level errors keyed by input name. */
  fieldErrors?: Record<string, string>;
}

export const initialFormState: FormState = { status: "idle", message: "" };

export function formError(
  message: string,
  fieldErrors?: Record<string, string>,
): FormState {
  return { status: "error", message, fieldErrors };
}

export function formSuccess(message: string): FormState {
  return { status: "success", message };
}

/** Paths that would bounce the visitor straight back into the auth flow. */
const REDIRECT_DENY_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/",
];

/**
 * Only same-origin relative paths may be used as post-login redirects.
 *
 * Resolving against a throwaway origin is what makes this safe: browsers treat
 * `//evil.com` *and* `/\evil.com` (and `/\/evil.com`, `\/evil.com`, …) as
 * protocol-relative URLs, so a prefix check alone is not enough. Anything that
 * resolves off-origin, or that carries a scheme, falls back.
 */
export function safeRedirectPath(
  raw: string | null | undefined,
  fallback = "/",
): string {
  if (!raw) return fallback;

  // Control characters (including \n, \r, \t) are stripped or ignored by
  // browsers when parsing URLs, so they can smuggle a different target.
  if (/[\u0000-\u001f\u007f]/.test(raw)) return fallback;
  if (!raw.startsWith("/") || raw.includes("\\")) return fallback;

  const base = "https://redirect.invalid";
  let resolved: URL;
  try {
    resolved = new URL(raw, base);
  } catch {
    return fallback;
  }
  if (resolved.origin !== base) return fallback;

  const path = `${resolved.pathname}${resolved.search}${resolved.hash}`;
  const lower = resolved.pathname.toLowerCase();
  if (REDIRECT_DENY_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
    return fallback;
  }
  return path;
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MIN_PASSWORD_LENGTH = 8;
