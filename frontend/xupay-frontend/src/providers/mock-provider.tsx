"use client";

import { useEffect } from "react";
import { mockWorkerReady } from "@/mocks/worker-ready";

/**
 * Boots the MSW worker in the browser so the showcase domains
 * (fraud/compliance/analytics/audit-log) are served. These have no real
 * backend, so the worker runs in every environment — it only intercepts
 * `/mock-api/*`, leaving all real API calls untouched.
 *
 * Children render immediately; the worker starts in the background, early.
 * mockFetch waits for the same start before every request, so a showcase
 * page's first fetch can no longer beat the worker to the network.
 */
export function MockProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    mockWorkerReady().catch((error) => console.error("Mock API worker failed to start", error));
  }, []);

  return <>{children}</>;
}
