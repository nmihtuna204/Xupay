"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { WalletDetailPanel } from "@/components/features/wallets/WalletDetailPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { useWalletBalance } from "@/hooks/queries/use-wallet";
import { isNotFoundError } from "@/lib/api/errors";

export function WalletDetailClient({ walletId }: { walletId: string }) {
  const walletQuery = useWalletBalance(walletId);

  return (
    <>
      <PageHeader title="Wallet details" />
      {walletQuery.data ? (
        <WalletDetailPanel wallet={walletQuery.data} />
      ) : walletQuery.isError && isNotFoundError(walletQuery.error) ? (
        <EmptyState title="Wallet not found" description="This wallet may have been removed." />
      ) : walletQuery.isError ? (
        <ErrorState title="Couldn't load this wallet" error={walletQuery.error} onRetry={() => walletQuery.refetch()} />
      ) : (
        <Skeleton className="h-52 rounded-xl" />
      )}
    </>
  );
}
