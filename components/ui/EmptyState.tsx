import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: ReactNode;
  action?: { href: string; label: string };
  className?: string;
  /**
   * Heading tag for the title. Defaults to `h2` because this panel usually sits
   * under a page heading; pass `h1` when the panel *is* the whole page (e.g. the
   * homepage catalog-outage state), so the document is never missing an h1.
   */
  as?: "h1" | "h2";
}

/** Neutral "nothing here yet" panel: search misses, empty My List, etc. */
export function EmptyState({
  title,
  message,
  icon,
  action,
  className,
  as: Heading = "h2",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "card-surface mx-auto flex max-w-lg flex-col items-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-mist-500">
          {icon}
        </span>
      ) : null}
      <Heading className="text-lg font-semibold text-mist-100">{title}</Heading>
      {message ? (
        <p className="max-w-md text-sm leading-relaxed text-mist-500">{message}</p>
      ) : null}
      {action ? (
        <Link href={action.href} className="btn-primary mt-2">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

export default EmptyState;
