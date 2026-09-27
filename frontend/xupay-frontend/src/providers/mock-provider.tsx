"use client";

import { useEffect, useState } from "react";

/**
 * Boots the MSW worker in the browser so the showcase domains
 * (fraud/compliance/analytics/audit-log) are served. These have no real
 * backend, so the worker runs in every environment — it only intercepts
 * `/mock-api/*`, leaving all real API calls untouched.
 *
 * Children render immediately; the worker starts in the background. The
 * showcase pages' first fetch may race the worker on a cold load, but
 * TanStack Query's retry re-runs it once the worker is ready.
 *
 * The start is shared at module level: MSW throws if start() runs on an
 * already-enabled worker, and the effect runs more than once (StrictMode in
 * dev, and every remount when navigating back into the app group).
 */
let workerStarted: Promise<unknown> | null = null;

function startWorker() {
  workerStarted ??= import("@/mocks/browser").then(({ worker }) =>
    worker.start({ onUnhandledRequest: "bypass", quiet: true })
  );
  return workerStarted;
}

export function MockProvider({ children }: { children: React.ReactNode }) {
  const [, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    startWorker().then(() => active && setReady(true));
    return () => {
      active = false;
    };
  }, []);

  return <>{children}</>;
}
