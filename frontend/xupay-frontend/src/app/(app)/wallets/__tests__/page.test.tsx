/**
 * Wallets Page Tests
 * File: src/app/(app)/wallets/__tests__/page.test.tsx
 * The page is wired to the real API hooks (mocked here).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import WalletsPage from '../page'

// ---- Mock auth (page reads user.id) ----
vi.mock('@/providers/AuthProvider', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-1', email: 'alice@example.com' },
    isLoading: false,
    isAuthenticated: true,
    logout: vi.fn(),
  })),
}))

// ---- Mock wallet hooks ----
const mockUseUserWallet = vi.fn()
const mockCreateWalletMutate = vi.fn()
vi.mock('@/hooks/api/useWallets.new', () => ({
  useUserWallet: (userId: string) => mockUseUserWallet(userId),
  useCreateWallet: () => ({
    mutate: mockCreateWalletMutate,
    isPending: false,
    isError: false,
    error: null,
  }),
}))

// ---- Mock transaction hooks ----
const mockDepositMutate = vi.fn()
const mockWithdrawMutate = vi.fn()
vi.mock('@/hooks/api/useTransactions.new', () => ({
  useDeposit: () => ({
    mutate: mockDepositMutate,
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
  }),
  useWithdraw: () => ({
    mutate: mockWithdrawMutate,
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
  }),
  useTransfer: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    status: 'idle',
    isError: false,
    isSuccess: false,
    data: null,
    error: null,
  }),
  useTransactions: () => ({
    data: { items: [], total: 0 },
    isLoading: false,
    isError: false,
  }),
}))

const activeWallet = {
  walletId: 'wallet-1',
  userId: 'user-1',
  balanceCents: 500000,
  balanceAmount: 5000,
  currency: 'VND',
  isActive: true,
  isFrozen: false,
}

describe('Wallets Page (My Wallet)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: wallet exists
    mockUseUserWallet.mockReturnValue({
      data: activeWallet,
      isLoading: false,
      isError: false,
    })
  })

  it('renders the page header', () => {
    render(<WalletsPage />)
    expect(screen.getByText('My Wallet')).toBeInTheDocument()
  })

  it('shows the real balance formatted in VND', () => {
    render(<WalletsPage />)
    const balance = screen.getByTestId('wallet-balance')
    // 500000 cents => 5.000 ₫ (vi-VN formatting)
    expect(balance.textContent).toContain('₫')
    expect(screen.getByTestId('wallet-balance-card')).toBeInTheDocument()
  })

  it('shows deposit and withdraw forms when wallet exists', () => {
    render(<WalletsPage />)
    expect(screen.getByTestId('deposit-form')).toBeInTheDocument()
    expect(screen.getByTestId('withdraw-form')).toBeInTheDocument()
  })

  it('submits a deposit in cents', () => {
    render(<WalletsPage />)
    fireEvent.change(screen.getByTestId('deposit-amount'), { target: { value: '150.50' } })
    fireEvent.click(screen.getByTestId('deposit-submit'))
    expect(mockDepositMutate).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', amountCents: 15050 }),
      expect.anything()
    )
  })

  it('submits a withdrawal in cents', () => {
    render(<WalletsPage />)
    fireEvent.change(screen.getByTestId('withdraw-amount'), { target: { value: '20' } })
    fireEvent.click(screen.getByTestId('withdraw-submit'))
    expect(mockWithdrawMutate).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', amountCents: 2000 }),
      expect.anything()
    )
  })

  it('renders the P2P transfer form with sender prefilled', () => {
    render(<WalletsPage />)
    expect(screen.getByTestId('transfer-card')).toBeInTheDocument()
    expect((screen.getByTestId('fromUserId') as HTMLInputElement).value).toBe('user-1')
  })

  it('shows a frozen badge when the wallet is frozen', () => {
    mockUseUserWallet.mockReturnValue({
      data: { ...activeWallet, isFrozen: true },
      isLoading: false,
      isError: false,
    })
    render(<WalletsPage />)
    expect(screen.getByTestId('wallet-frozen-badge')).toBeInTheDocument()
  })

  it('offers wallet creation when the user has no wallet', () => {
    mockUseUserWallet.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Wallet not found'),
    })
    render(<WalletsPage />)

    expect(screen.getByTestId('create-wallet-card')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('create-wallet-button'))
    expect(mockCreateWalletMutate).toHaveBeenCalledWith({
      userId: 'user-1',
      walletType: 'PERSONAL',
      currency: 'VND',
    })
  })

  it('shows a loading skeleton while the wallet query is pending', () => {
    mockUseUserWallet.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })
    render(<WalletsPage />)
    expect(screen.getByTestId('wallet-loading')).toBeInTheDocument()
  })
})
