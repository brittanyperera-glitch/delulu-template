"use client";

import { useEffect } from "react";
import { STRINGS } from "@/lib/content/strings";
import { recoverFromStaleBuild } from "@/lib/stale-build";

// global-error replaces the whole document, so it is the only boundary that catches a failure in
// the root layout itself, including a stale-build chunk failure on a cold open. It renders without
// the app's stylesheet, so the markup is deliberately plain; on the common stale case it reloads
// before any of it is seen.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    recoverFromStaleBuild(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100dvh",
          margin: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          padding: "1.5rem",
          textAlign: "center",
          background: "#f3e5c8",
          color: "#4a2c17",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "1.75rem", margin: 0 }}>{STRINGS.error.title}</h1>
        <p style={{ margin: 0 }}>{STRINGS.error.blurb}</p>
        <button
          type="button"
          onClick={reset}
          style={{
            border: "2px solid #4a2c17",
            borderRadius: "9999px",
            background: "#4a2c17",
            color: "#f3e5c8",
            padding: "0.5rem 1.25rem",
            font: "inherit",
            cursor: "pointer",
          }}
        >
          {STRINGS.error.cta}
        </button>
      </body>
    </html>
  );
}
