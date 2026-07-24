"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  transfer,
  deposit,
  withdraw,
  type TransferRequest,
  type DepositRequest,
  type WithdrawRequest,
} from "@/lib/api/payment-service/payments";
import { walletKeys, transactionKeys } from "@/lib/query-keys";

/**
 * Money-movement mutations are pessimistic (no optimistic cache writes) —
 * correctness over snappiness for a payments flow. On success we invalidate
 * the wallet balance and transaction list so the UI reflects the ledger,
 * rather than guessing the new balance client-side.
 */
function useInvalidateMoneyQueries() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: walletKeys.all });
    queryClient.invalidateQueries({ queryKey: transactionKeys.all });
  };
}

export function useTransfer() {
  const invalidate = useInvalidateMoneyQueries();
  return useMutation({
    mutationFn: (payload: TransferRequest) => transfer(payload),
    onSuccess: invalidate,
  });
}

export function useDeposit() {
  const invalidate = useInvalidateMoneyQueries();
  return useMutation({
    mutationFn: (payload: DepositRequest) => deposit(payload),
    onSuccess: invalidate,
  });
}

export function useWithdraw() {
  const invalidate = useInvalidateMoneyQueries();
  return useMutation({
    mutationFn: (payload: WithdrawRequest) => withdraw(payload),
    onSuccess: invalidate,
  });
}
