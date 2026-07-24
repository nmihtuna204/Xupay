/**
 * Fetch client for the four mock-only showcase domains. Uses the browser
 * fetch API against `/mock-api/*` URLs, which the MSW worker intercepts.
 * Kept separate from the axios API clients so it's unmistakable these
 * endpoints are mock-served and never hit a real backend.
 */
export async function mockFetch<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
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
