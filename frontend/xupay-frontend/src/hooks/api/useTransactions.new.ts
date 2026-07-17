/* ============================================
   TRANSACTIONS HOOKS (NEW) - Using paymentServiceClient
   Migrated from old lib/api approach
   ============================================ */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPaymentServiceClient } from '@/lib/paymentServiceClient';
import type { TransferRequest, TransactionDetailResponse } from '@/lib/paymentServiceClient';
import { walletsKeys } from './useWallets.new';

// ============================================
// QUERY KEYS
// ============================================

export const transactionsKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionsKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...transactionsKeys.lists(), filters] as const,
  detail: (id: string) => [...transactionsKeys.all, 'detail', id] as const,
  byIdempotencyKey: (key: string) => [...transactionsKeys.all, 'idempotency', key] as const,
};

// ============================================
// QUERIES
// ============================================

/**
 * Get transaction by ID
 */
export function useTransaction(transactionId: string) {
  const client = getPaymentServiceClient();

  return useQuery({
    queryKey: transactionsKeys.detail(transactionId),
    queryFn: () => client.getTransaction(transactionId),
    enabled: !!transactionId,
  });
}

/**
 * Get transaction by idempotency key
 */
export function useTransactionByIdempotencyKey(idempotencyKey: string) {
  const client = getPaymentServiceClient();

  return useQuery({
    queryKey: transactionsKeys.byIdempotencyKey(idempotencyKey),
    queryFn: () => client.getByIdempotencyKey(idempotencyKey),
    enabled: !!idempotencyKey,
  });
}

/**
 * List transactions with filters
 */
export function useTransactions(
  params?: { userId?: string; page?: number; size?: number },
  options?: { enabled?: boolean }
) {
  const client = getPaymentServiceClient();

  return useQuery({
    queryKey: transactionsKeys.list(params || {}),
    queryFn: () => client.listTransactions(params),
    staleTime: 30 * 1000, // 30 seconds
    enabled: options?.enabled ?? true,
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a transfer (P2P payment)
 */
export function useTransfer() {
  const queryClient = useQueryClient();
  const client = getPaymentServiceClient();

  return useMutation({
    mutationFn: (request: TransferRequest) => client.transfer(request),
    onSuccess: (data, variables) => {
      // Invalidate transaction lists
      queryClient.invalidateQueries({ queryKey: transactionsKeys.lists() });
      
      // Invalidate wallet balances for both sender and receiver
      queryClient.invalidateQueries({ queryKey: walletsKeys.userWallet(variables.fromUserId) });
      queryClient.invalidateQueries({ queryKey: walletsKeys.userWallet(variables.toUserId) });
      
      // Set the new transaction in cache
      queryClient.setQueryData(transactionsKeys.detail(data.transactionId), data);
    },
  });
}

/**
 * Deposit (top-up) into the user's wallet.
 * Generates an idempotency key automatically when the caller doesn't supply one.
 */
export function useDeposit() {
  const queryClient = useQueryClient();
  const client = getPaymentServiceClient();

  return useMutation({
    mutationFn: (request: { userId: string; amountCents: number; description?: string; idempotencyKey?: string }) =>
      client.deposit({
        idempotencyKey: request.idempotencyKey ?? crypto.randomUUID(),
        userId: request.userId,
        amountCents: request.amountCents,
        description: request.description,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: transactionsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: walletsKeys.userWallet(variables.userId) });
      queryClient.invalidateQueries({ queryKey: walletsKeys.all });
    },
  });
}

/**
 * Withdraw from the user's wallet to an external destination.
 * Generates an idempotency key automatically when the caller doesn't supply one.
 */
export function useWithdraw() {
  const queryClient = useQueryClient();
  const client = getPaymentServiceClient();

  return useMutation({
    mutationFn: (request: { userId: string; amountCents: number; description?: string; idempotencyKey?: string }) =>
      client.withdraw({
        idempotencyKey: request.idempotencyKey ?? crypto.randomUUID(),
        userId: request.userId,
        amountCents: request.amountCents,
        description: request.description,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: transactionsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: walletsKeys.userWallet(variables.userId) });
      queryClient.invalidateQueries({ queryKey: walletsKeys.all });
    },
  });
}

// ============================================
// HELPER: Unified transaction type
// ============================================

export type Transaction = TransactionDetailResponse;
