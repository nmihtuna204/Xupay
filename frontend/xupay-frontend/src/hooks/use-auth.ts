"use client";

import { useEffect } from "react";
import { useCurrentUser } from "@/hooks/queries/use-current-user";
import { useLogout } from "@/hooks/mutations/use-auth-mutations";
import { useSessionStore } from "@/store/session-store";
import { getToken } from "@/lib/session";

/** Single entry point pages/components use to read "who's logged in". */
export function useAuth() {
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

  return {
    user: query.data ?? null,
    isLoading: !!getToken() && query.isLoading,
    isAuthenticated: !!getToken() && !query.isError,
    logout: () => logoutMutation.mutate(),
  };
}
