"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { WalletDetailPanel } from "@/components/features/wallets/WalletDetailPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useWalletBalance } from "@/hooks/queries/use-wallet";

export function WalletDetailClient({ walletId }: { walletId: string }) {
  const walletQuery = useWalletBalance(walletId);

  return (
    <>
      <PageHeader title="Wallet details" />
      {walletQuery.isLoading ? (
        <Skeleton className="h-52 rounded-2xl" />
      ) : walletQuery.data ? (
        <WalletDetailPanel wallet={walletQuery.data} />
      ) : (
        <EmptyState title="Wallet not found" description="This wallet may have been removed." />
      )}
    </>
  );
}
