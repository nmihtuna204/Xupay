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
import { markSignedIn, clearSession } from "@/lib/session";
import { authKeys, walletKeys } from "@/lib/query-keys";
import { useSessionStore } from "@/store/session-store";

/**
 * Login/register set the HttpOnly token cookie and return only
 * { token, userId, email } — no nested user object. The web app ignores the
 * body's token (it is there for scripts and API clients) and never stores
 * it: the cookie authenticates every call. So after a successful sign-in we
 * mark the session and follow up with GET /api/auth/me to hydrate the full
 * user for the session store + cache.
 */
async function completeAuth(
  queryClient: ReturnType<typeof useQueryClient>,
  setSessionState: (user: Awaited<ReturnType<typeof getCurrentUser>>) => void
) {
  markSignedIn();
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
    onSuccess: () => completeAuth(queryClient, setSessionState),
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const setSessionState = useSessionStore((s) => s.setSession);

  return useMutation({
    mutationFn: (payload: RegisterRequest) => registerRequest(payload),
    onSuccess: async () => {
      const user = await completeAuth(queryClient, setSessionState);
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
    // Server side: revokes this session's token (in both services) and
    // deletes the cookie. Other devices stay signed in.
    mutationFn: logoutRequest,
    onSettled: () => {
      clearSession();
      clearSessionState();
      queryClient.clear();
      if (typeof window !== "undefined") window.location.assign("/login");
    },
  });
}
