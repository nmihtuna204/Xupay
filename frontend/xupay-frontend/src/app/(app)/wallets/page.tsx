"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { WalletDetailPanel } from "@/components/features/wallets/WalletDetailPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useWalletByUser } from "@/hooks/queries/use-wallet";
import { useQueryClient } from "@tanstack/react-query";
import { createWallet } from "@/lib/api/payment-service/wallets";
import { isNotFoundError } from "@/lib/api/errors";
import { walletKeys } from "@/lib/query-keys";
import { toast } from "sonner";
import { useState } from "react";

export default function WalletsPage() {
  const auth = useAuth();
  const { user } = auth;
  const walletQuery = useWalletByUser(user?.id);
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);

  async function handleCreateWallet() {
    if (!user) return;
    setCreating(true);
    try {
      await createWallet({ userId: user.id, walletType: "PERSONAL", currency: "VND" });
      await queryClient.invalidateQueries({ queryKey: walletKeys.all });
      toast.success("Wallet created");
    } catch {
      toast.error("Couldn't create a wallet");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <PageHeader title="Wallets" description="Your balance and wallet controls." />

      {walletQuery.data ? (
        <WalletDetailPanel wallet={walletQuery.data} />
      ) : auth.isError ? (
        <ErrorState title="Couldn't load your account" error={auth.error} onRetry={auth.retry} />
      ) : walletQuery.isError && !isNotFoundError(walletQuery.error) ? (
        <ErrorState title="Couldn't load your wallet" error={walletQuery.error} onRetry={() => walletQuery.refetch()} />
      ) : !walletQuery.isError ? (
        <Skeleton className="h-52 rounded-xl" />
      ) : (
        // The one state that offers "create": the lookup answered "no wallet".
        <EmptyState
          title="No wallet yet"
          description="Create a personal wallet to start sending and receiving money."
          action={
            <Button onClick={handleCreateWallet} disabled={creating} className="mt-2">
              Create wallet
            </Button>
          }
        />
      )}
    </>
  );
}
