/* ============================================
   TEST UTILS - Shared render helpers for tests
   Wraps components in the providers the app
   provides at runtime (React Query + Auth).
   ============================================ */

import React, { type ReactElement, type ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/providers/AuthProvider'

/**
 * Create a fresh QueryClient per test to avoid cache leaking between tests.
 * Retries are disabled so failing queries reject immediately.
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

interface ProvidersProps {
  children: ReactNode
}

function AllProviders({ children }: ProvidersProps) {
  const queryClient = createTestQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}

/**
 * Render a component wrapped in QueryClientProvider + AuthProvider.
 * Use for components that call useAuth() or React Query hooks
 * (Topbar, Sidebar, UserMenu, dashboard pages, ...).
 */
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options })
}

export * from '@testing-library/react'
