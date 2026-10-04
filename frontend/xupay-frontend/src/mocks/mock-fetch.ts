import { mockWorkerReady } from "./worker-ready";

/**
 * Fetch client for the four mock-only showcase domains. Uses the browser
 * fetch API against `/mock-api/*` URLs, which the MSW worker intercepts.
 * Kept separate from the axios API clients so it's unmistakable these
 * endpoints are mock-served and never hit a real backend.
 */
export async function mockFetch<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  // These URLs only answer inside the MSW worker. A page's queries start
  // before MockProvider's effect even asks for the worker, so the first
  // request used to reach Next.js and 404; the one retry often lost the same
  // race, and the showcase pages render skeletons until data arrives -
  // forever. Wait for the worker. (Tests run MSW in Node: no service worker.)
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    await mockWorkerReady().catch(() => undefined);
  }

  const url = new URL(path, typeof window !== "undefined" ? window.location.origin : "http://localhost");
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Mock request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}
