"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { WalletCard } from "@/components/features/wallets/WalletCard";
import { QuickActions } from "@/components/features/dashboard/QuickActions";
import { TransactionTable } from "@/components/features/payments/TransactionTable";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useWalletByUser } from "@/hooks/queries/use-wallet";
import { useTransactions } from "@/hooks/queries/use-transactions";

export default function DashboardPage() {
  const { user } = useAuth();
  const walletQuery = useWalletByUser(user?.id);
  const transactionsQuery = useTransactions({ userId: user?.id, page: 0, size: 5 });

  return (
    <>
      <PageHeader
        title={`Welcome back${user ? `, ${user.firstName}` : ""}`}
        description="Here's what's happening with your wallet."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          {walletQuery.isLoading ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : walletQuery.data ? (
            <WalletCard wallet={walletQuery.data} />
          ) : (
            <EmptyState title="No wallet found" description="A wallet is created automatically on signup." />
          )}
        </div>
        <div className="lg:col-span-2">
          <QuickActions />
        </div>
      </div>

      <div className="glass-card mt-4 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-medium">Recent transactions</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/transactions">
              View all <ArrowRight />
            </Link>
          </Button>
        </div>
        {transactionsQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <TransactionTable transactions={transactionsQuery.data?.items ?? []} />
        )}
      </div>
    </>
  );
}
