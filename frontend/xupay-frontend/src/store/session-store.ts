import { create } from "zustand";
import type { UserResponse } from "@/lib/api/user-service/auth";

/**
 * Session-only client state. Deliberately thin: the source of truth for the
 * user object is the `useCurrentUser` TanStack Query cache (via GET
 * /api/auth/me) — this store just holds the synchronous "am I logged in"
 * flag so layout/nav code doesn't have to wait on a query before deciding
 * what to render, plus a cached display user for the topbar avatar so it
 * doesn't flash empty between navigations.
 */
interface SessionState {
  isAuthenticated: boolean;
  displayUser: Pick<UserResponse, "firstName" | "lastName" | "email"> | null;
  setSession: (user: UserResponse | null) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  isAuthenticated: false,
  displayUser: null,
  setSession: (user) =>
    set({
      isAuthenticated: !!user,
      displayUser: user
        ? { firstName: user.firstName, lastName: user.lastName, email: user.email }
        : null,
    }),
  clear: () => set({ isAuthenticated: false, displayUser: null }),
}));
