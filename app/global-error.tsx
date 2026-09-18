"use client";

import { useEffect } from "react";
import Link from "next/link";

import { siteConfig } from "@/lib/config/site";

/**
 * Last-resort error boundary. React mounts this only when the root layout
 * itself throws, which means the layout's <html>/<body>, fonts, navbar and
 * global stylesheet are all unavailable — so this file must render its own
 * document shell. `siteConfig` is a plain constant module with no side effects,
 * so it is still safe to read here.
 *
 * Styling is inline for the same reason: styles/globals.css is injected by the
 * layout that just failed, so Tailwind classes would not resolve here.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Only the digest is safe to surface: the raw message can carry internals.
    console.error("[global-error]", error.digest ?? "unhandled");
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: siteConfig.themeColor,
          color: "#e7e7ea",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          padding: "24px",
        }}
      >
        <main style={{ maxWidth: "28rem", textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#e11d48",
              fontWeight: 700,
            }}
          >
            {siteConfig.name}
          </p>
          <h1
            style={{
              margin: "12px 0 0",
              fontSize: "24px",
              lineHeight: 1.25,
              fontWeight: 800,
            }}
          >
            The app failed to start
          </h1>
          <p
            style={{
              margin: "12px 0 0",
              fontSize: "14px",
              lineHeight: 1.6,
              color: "#a1a1aa",
            }}
          >
            Something broke outside of any single page. Reloading usually clears
            it. If it keeps happening, the server logs hold the details.
          </p>
          {error.digest ? (
            <p
              style={{
                margin: "12px 0 0",
                fontSize: "12px",
                color: "#71717a",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              }}
            >
              Reference: {error.digest}
            </p>
          ) : null}
          <div
            style={{
              marginTop: "24px",
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                cursor: "pointer",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#e11d48",
                color: "#ffffff",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              Try again
            </button>
            <Link
              href="/"
              style={{
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.16)",
                color: "#e7e7ea",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Go home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
