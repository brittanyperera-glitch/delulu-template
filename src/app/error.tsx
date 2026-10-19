"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { STRINGS } from "@/lib/content/strings";
import { recoverFromStaleBuild } from "@/lib/stale-build";

// Next's error-boundary contract passes `error`, but production builds strip its message,
// so we never render it — our own copy is the only user-facing text here.
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // A tab left open across a deploy throws a chunk-load error the moment it navigates, because the
  // new build renamed the files it is asking for. Fetch the current build once rather than strand
  // the reader here; any other error just shows the message below.
  useEffect(() => {
    recoverFromStaleBuild(error);
  }, [error]);

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-display text-3xl tracking-wide text-brown">{STRINGS.error.title}</h1>
      <p className="font-body text-brown">{STRINGS.error.blurb}</p>
      <Button kind="primary" onClick={reset}>
        {STRINGS.error.cta}
      </Button>
    </main>
  );
}
