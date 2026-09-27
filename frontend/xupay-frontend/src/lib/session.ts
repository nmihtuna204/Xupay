/**
 * Session storage: the JWT itself lives in localStorage (attached to API
 * requests by the axios interceptors in lib/api/client-factory.ts).
 *
 * proxy.ts (Next's server-side route guard, née middleware.ts — renamed in
 * Next.js 16) can't read localStorage, so we mirror a *non-sensitive* flag
 * cookie alongside it purely so the server can tell "logged in" from
 * "logged out" without ever seeing the token itself.
 */

const TOKEN_KEY = "xupay_token";
const SESSION_COOKIE = "xupay_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 24h, matches backend JWT_EXPIRATION
/** Same-tab change signal; the `storage` event only fires in *other* tabs. */
const SESSION_EVENT = "xupay:session";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; samesite=lax`;
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
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
