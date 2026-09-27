"use client";

import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/api/user-service/auth";
import { authKeys } from "@/lib/query-keys";
import { useHasSession } from "@/hooks/use-session";

/** GET /api/auth/me — only fires when a token exists, so public pages never call it. */
export function useCurrentUser() {
  const hasSession = useHasSession();
  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: getCurrentUser,
    enabled: hasSession,
    staleTime: 60_000,
    retry: false,
  });
}
