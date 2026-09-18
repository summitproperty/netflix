/** Typed error helpers so UI can show precise, user-friendly messages. */

export type AppErrorKind =
  | "tmdb"
  | "not-found"
  | "auth"
  | "database"
  | "network"
  | "config"
  | "unknown";

export class AppError extends Error {
  readonly kind: AppErrorKind;
  readonly status: number;

  constructor(kind: AppErrorKind, message: string, status = 500) {
    super(message);
    this.name = "AppError";
    this.kind = kind;
    this.status = status;
  }
}

export class TMDBError extends AppError {
  constructor(message: string, status = 502) {
    super(status === 404 ? "not-found" : "tmdb", message, status);
    this.name = "TMDBError";
  }
}

export function isNotFound(error: unknown): boolean {
  return error instanceof AppError && (error.kind === "not-found" || error.status === 404);
}

/** Never leak internals (URLs, tokens, stack traces) into the UI. */
export function toUserMessage(error: unknown): string {
  if (error instanceof AppError) {
    switch (error.kind) {
      case "not-found":
        return "We could not find that title.";
      case "tmdb":
        return "The catalog is not responding right now. Please try again in a moment.";
      case "auth":
        return error.message || "Please sign in to continue.";
      case "database":
        return "We could not save that right now. Please try again.";
      case "network":
        return "Network problem. Check your connection and try again.";
      case "config":
        return "This feature is not configured yet.";
      default:
        return "Something went wrong. Please try again.";
    }
  }
  if (error instanceof Error && error.name === "AbortError") {
    return "That request took too long. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

/** Structured server-side logging without echoing secrets. */
export function logError(scope: string, error: unknown): void {
  const detail =
    error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  console.error(`[nafij-netflix:${scope}] ${detail}`);
}
