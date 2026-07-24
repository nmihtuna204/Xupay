"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Error boundary for the authenticated app group. Catches render/data errors
 * in any (app) page so a single failing query never blanks the whole shell.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In a real deployment this would go to Sentry/Datadog.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        We hit an unexpected error loading this page. You can try again — if it keeps happening,
        please come back in a moment.
      </p>
      <Button onClick={reset} className="mt-2">
        <RotateCcw /> Try again
      </Button>
    </div>
  );
}
