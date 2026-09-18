import Link from "next/link";

import { AlertIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/utils/cn";

interface ErrorStateProps {
  title?: string;
  message?: string;
  /** Optional client-side retry (pass reset from an error boundary). */
  onRetry?: () => void;
  retryLabel?: string;
  /** Optional navigation escape hatch. */
  action?: { href: string; label: string };
  className?: string;
}

/** Reusable failure panel. Never renders raw error objects. */
export function ErrorState({
  title = "Something went wrong",
  message = "Please try again in a moment.",
  onRetry,
  retryLabel = "Try again",
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "card-surface mx-auto flex max-w-lg flex-col items-center gap-3 px-6 py-10 text-center",
        className,
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/15 text-brand">
        <AlertIcon width={22} height={22} />
      </span>
      <h2 className="text-lg font-semibold text-mist-100">{title}</h2>
      <p className="max-w-md text-sm leading-relaxed text-mist-500">{message}</p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        {onRetry ? (
          <button type="button" onClick={onRetry} className="btn-primary">
            {retryLabel}
          </button>
        ) : null}
        {action ? (
          <Link href={action.href} className="btn-secondary">
            {action.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export default ErrorState;
