"use client";

import { useQuery } from "@tanstack/react-query";
import { getWalletByUserId, getWalletBalance } from "@/lib/api/payment-service/wallets";
import { walletKeys } from "@/lib/query-keys";

export function useWalletByUser(userId: string | undefined) {
  return useQuery({
    queryKey: walletKeys.byUser(userId ?? ""),
    queryFn: () => getWalletByUserId(userId as string),
    enabled: !!userId,
    staleTime: 15_000,
  });
}

export function useWalletBalance(walletId: string | undefined) {
  return useQuery({
    queryKey: walletKeys.balance(walletId ?? ""),
    queryFn: () => getWalletBalance(walletId as string),
    enabled: !!walletId,
    staleTime: 15_000,
  });
}
