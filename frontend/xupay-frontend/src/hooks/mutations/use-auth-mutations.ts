"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  login as loginRequest,
  register as registerRequest,
  logout as logoutRequest,
  getCurrentUser,
  type LoginRequest,
  type RegisterRequest,
} from "@/lib/api/user-service/auth";
import { createWallet } from "@/lib/api/payment-service/wallets";
import { setSession, clearSession } from "@/lib/session";
import { authKeys, walletKeys } from "@/lib/query-keys";
import { useSessionStore } from "@/store/session-store";

/**
 * Login/register both return only { token, userId, email } — no nested
 * user object (verified against the live backend, which diverges from the
 * API docs). So after storing the token we always follow up with
 * GET /api/auth/me to hydrate the full user for the session store + cache.
 */
async function completeAuth(
  token: string,
  queryClient: ReturnType<typeof useQueryClient>,
  setSessionState: (user: Awaited<ReturnType<typeof getCurrentUser>>) => void
) {
  setSession(token);
  const user = await getCurrentUser();
  setSessionState(user);
  queryClient.setQueryData(authKeys.currentUser(), user);
  return user;
}

export function useLogin() {
  const queryClient = useQueryClient();
  const setSessionState = useSessionStore((s) => s.setSession);

  return useMutation({
    mutationFn: (payload: LoginRequest) => loginRequest(payload),
    onSuccess: (data) => completeAuth(data.token, queryClient, setSessionState),
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const setSessionState = useSessionStore((s) => s.setSession);

  return useMutation({
    mutationFn: (payload: RegisterRequest) => registerRequest(payload),
    onSuccess: async (data) => {
      const user = await completeAuth(data.token, queryClient, setSessionState);
      // The backend does not auto-provision a wallet on signup (verified:
      // GET /api/wallets/user/:id 400s "Wallet not found" right after
      // register) — create one so the dashboard isn't empty on first login.
      try {
        await createWallet({ userId: user.id, walletType: "PERSONAL", currency: "VND" });
        queryClient.invalidateQueries({ queryKey: walletKeys.all });
      } catch {
        // Non-fatal: the wallet page/dashboard offers a manual "create
        // wallet" action as a fallback if this best-effort call fails.
      }
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const clearSessionState = useSessionStore((s) => s.clear);

  return useMutation({
    mutationFn: logoutRequest,
    onSettled: () => {
      clearSession();
      clearSessionState();
      queryClient.clear();
      if (typeof window !== "undefined") window.location.assign("/login");
    },
  });
}
