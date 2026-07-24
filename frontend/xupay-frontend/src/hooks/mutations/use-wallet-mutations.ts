"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { freezeWallet, type FreezeWalletRequest } from "@/lib/api/payment-service/wallets";
import { walletKeys } from "@/lib/query-keys";

export function useFreezeWallet(walletId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FreezeWalletRequest) => freezeWallet(walletId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}
