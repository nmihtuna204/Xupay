"use client";

import { useQuery } from "@tanstack/react-query";
import {
  listTransactions,
  getTransaction,
  type ListTransactionsParams,
} from "@/lib/api/payment-service/payments";
import { transactionKeys } from "@/lib/query-keys";

export function useTransactions(params: ListTransactionsParams) {
  return useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: () => listTransactions(params),
    enabled: !!params.userId,
    placeholderData: (prev) => prev,
    staleTime: 10_000,
  });
}

export function useTransaction(transactionId: string | undefined) {
  return useQuery({
    queryKey: transactionKeys.detail(transactionId ?? ""),
    queryFn: () => getTransaction(transactionId as string),
    enabled: !!transactionId,
  });
}
