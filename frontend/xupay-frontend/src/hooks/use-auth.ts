"use client";

import { useEffect } from "react";
import { useCurrentUser } from "@/hooks/queries/use-current-user";
import { useLogout } from "@/hooks/mutations/use-auth-mutations";
import { useHasSession, useHydrated } from "@/hooks/use-session";
import { useSessionStore } from "@/store/session-store";
import { clearSession } from "@/lib/session";

/** Single entry point pages/components use to read "who's logged in". */
export function useAuth() {
  const hydrated = useHydrated();
  const hasSession = useHasSession();
  const query = useCurrentUser();
  const setSession = useSessionStore((s) => s.setSession);
  const clear = useSessionStore((s) => s.clear);
  const logoutMutation = useLogout();

  useEffect(() => {
    if (query.data) setSession(query.data);
  }, [query.data, setSession]);

  useEffect(() => {
    if (query.isError) clear();
  }, [query.isError, clear]);

  // Every consumer lives under the (app) group, which proxy.ts only serves to
  // a request carrying the session cookie. A cookie without the matching
  // localStorage flag (site data partly cleared, or a session from before
  // the token moved into an HttpOnly cookie) is treated as signed out,
  // exactly like the 401 path in client-factory: sign in again.
  useEffect(() => {
    if (hydrated && !hasSession) {
      clearSession();
      window.location.assign("/login");
    }
  }, [hydrated, hasSession]);

  return {
    // Gated on hasSession, not just on the query: the Topbar hydrates first
    // and can fill the cache before a page's own tree hydrates, and handing
    // that page a user the server HTML never had is a hydration mismatch.
    user: hasSession ? (query.data ?? null) : null,
    /** Still working out who is logged in (includes the server render). */
    isLoading: !hydrated || (hasSession && query.isPending),
    /** /auth/me failed for a reason other than a dead session (401s redirect). */
    isError: hasSession && query.isError,
    error: hasSession ? query.error : null,
    retry: () => query.refetch(),
    isAuthenticated: hasSession && !query.isError,
    logout: () => logoutMutation.mutate(),
  };
}
