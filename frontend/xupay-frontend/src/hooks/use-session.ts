"use client";

import { useSyncExternalStore } from "react";
import { getToken, subscribeToSession } from "@/lib/session";

/**
 * Whether a token is present, safe to read during render.
 *
 * The token lives in localStorage, which the server cannot see, so the server
 * always renders the logged-out branch. Reading getToken() straight in render
 * made the first client render disagree with that HTML and React threw a
 * hydration error. useSyncExternalStore resolves it the supported way: while
 * hydrating it returns the server snapshot (false), then re-renders with the
 * real value immediately after.
 */
export function useHasSession(): boolean {
  return useSyncExternalStore(subscribeToSession, () => !!getToken(), () => false);
}

const noopSubscribe = () => () => {};

/** False on the server and during hydration, true once the client has taken over. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
