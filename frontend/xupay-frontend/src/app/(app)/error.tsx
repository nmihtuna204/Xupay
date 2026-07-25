"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowCounterClockwise, Warning } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

/**
 * Error boundary for the authenticated app group. Catches render/data errors in
 * any (app) page so a single failing query never blanks the whole shell.
 *
 * Uses `unstable_retry` rather than `reset`. `reset` only clears the error state
 * and re-renders the same children without re-fetching, so a failed request
 * simply fails again and the button looks broken. `unstable_retry` re-fetches
 * the segment, which is what a "Try again" button has to mean.
 */
export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // In a real deployment this would go to Sentry/Datadog.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-error/10">
        <Warning weight="light" className="size-[18px] text-error" />
      </div>
      <h1 className="mt-4 text-base font-semibold">Something went wrong</h1>
      <p className="mt-1.5 max-w-[44ch] text-sm leading-relaxed text-muted-foreground">
        We could not load this page. Retrying will fetch it again. If it keeps
        failing, the service may be briefly unavailable.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-xs text-muted-foreground/60">
          Reference {error.digest}
        </p>
      )}
      <div className="mt-6 flex items-center gap-2">
        <Button onClick={() => unstable_retry()}>
          <ArrowCounterClockwise weight="light" /> Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
