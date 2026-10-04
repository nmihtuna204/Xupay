/**
 * Session state in the browser.
 *
 * The access token is an HttpOnly cookie user-service sets on sign-in. The
 * browser attaches it to API calls (the axios clients use `withCredentials`)
 * and no script on the page, an injected one included, can read it. This
 * module never sees the token.
 *
 * What it keeps is a non-sensitive "signed in" flag, in two places:
 * - localStorage, read during render (see useHasSession) and broadcast to
 *   other tabs by the `storage` event;
 * - the `xupay_session` cookie, because proxy.ts (Next's server-side route
 *   guard, née middleware.ts — renamed in Next.js 16) can't read
 *   localStorage, and the token cookie belongs to the API's host, which in
 *   production need not be this one.
 * The flag only steers navigation; every API call is still authorized by the
 * token cookie, and a 401 clears the flag (lib/api/client-factory.ts).
 */

const SESSION_KEY = "xupay_session";
/** Where the token itself used to live, before it moved to the HttpOnly cookie. */
const LEGACY_TOKEN_KEY = "xupay_token";
const SESSION_COOKIE = "xupay_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 24h, matches backend JWT_EXPIRATION
/** Same-tab change signal; the `storage` event only fires in *other* tabs. */
const SESSION_EVENT = "xupay:session";

export function hasSession(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SESSION_KEY) === "1";
}

/** Call once sign-in or sign-up has succeeded (the server has set the token cookie). */
export function markSignedIn(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.setItem(SESSION_KEY, "1");
  document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; samesite=lax`;
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
  window.dispatchEvent(new Event(SESSION_EVENT));
}

/** useSyncExternalStore subscriber: fires on login/logout here or in another tab. */
export function subscribeToSession(onChange: () => void): () => void {
  window.addEventListener(SESSION_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SESSION_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
