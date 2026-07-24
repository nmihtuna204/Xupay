"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { WalletDetailPanel } from "@/components/features/wallets/WalletDetailPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useWalletByUser } from "@/hooks/queries/use-wallet";
import { useQueryClient } from "@tanstack/react-query";
import { createWallet } from "@/lib/api/payment-service/wallets";
import { walletKeys } from "@/lib/query-keys";
import { toast } from "sonner";
import { useState } from "react";

export default function WalletsPage() {
  const { user } = useAuth();
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

      {walletQuery.isLoading ? (
        <Skeleton className="h-52 rounded-2xl" />
      ) : walletQuery.data ? (
        <WalletDetailPanel wallet={walletQuery.data} />
      ) : (
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
