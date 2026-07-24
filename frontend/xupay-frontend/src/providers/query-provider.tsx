"use client";

import { useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ApiError } from "@/lib/api/errors";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // useState (not module scope) so each request/browser session gets its own
  // client on the server, while the client still gets one stable instance
  // across re-renders.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            // Don't retry on 4xx (e.g. "wallet not found" for a brand-new
            // user) — those are expected, stable outcomes, not transient
            // failures. Only retry once on 5xx/network errors.
            retry: (failureCount, error) => {
              if (error instanceof ApiError && error.statusCode < 500 && error.statusCode !== 0) {
                return false;
              }
              return failureCount < 1;
            },
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
