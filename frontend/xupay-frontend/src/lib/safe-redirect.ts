const FALLBACK = "/dashboard";

/**
 * Where to send someone after sign-in, given the `from` the URL carries.
 *
 * Anyone can craft `from`, so only same-origin paths are followed. Checking
 * the raw string's prefix is not enough: the URL parser drops tabs and
 * newlines, so "/\t/evil.example" (sent as /%09/evil.example) passes a
 * "starts with / but not //" test and still lands on //evil.example. The
 * value is resolved exactly as the browser will resolve it, and only kept
 * if that stays on this origin.
 */
export function safeRedirect(from: string | null, origin: string = window.location.origin): string {
  if (!from || !from.startsWith("/")) return FALLBACK;

  let url: URL;
  try {
    url = new URL(from, origin);
  } catch {
    return FALLBACK;
  }
  if (url.origin !== origin) return FALLBACK;

  return `${url.pathname}${url.search}${url.hash}`;
}
