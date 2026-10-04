import { type ReactElement, type ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { markSignedIn } from "@/lib/session";
import type { UserResponse } from "@/lib/api/user-service/auth";

/** A QueryClient with retries off and caching disabled for deterministic tests. */
export function makeTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & { queryClient?: QueryClient }
) {
  const queryClient = options?.queryClient ?? makeTestQueryClient();
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { queryClient, ...render(ui, { wrapper: Wrapper, ...options }) };
}

export const TEST_USER: UserResponse = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  phone: "+84901234567",
  kycStatus: "APPROVED",
  kycTier: "TIER_2",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

/** Marks the session signed in so `useHasSession()` is true and auth-gated queries fire. */
export function seedSession() {
  markSignedIn();
}
