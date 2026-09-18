"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/ui/ErrorState";

/**
 * Route-level error boundary. Shows a friendly panel and never renders the raw
 * error message, which could leak internals.
 */
export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server logs already contain the details; this helps local debugging.
    console.error("[route-error]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="page-shell">
      <ErrorState
        title="This page could not be loaded"
        message="Something went wrong while loading the catalog. Try again, or head back to the homepage."
        onRetry={reset}
        action={{ href: "/", label: "Go home" }}
      />
    </div>
  );
}
