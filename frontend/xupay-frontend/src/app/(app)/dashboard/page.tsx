"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
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

      {/* Balance hero — full width, the primary object on the page. */}
      {walletQuery.isLoading ? (
        <Skeleton className="h-52 rounded-xl" />
      ) : walletQuery.data ? (
        <WalletCard wallet={walletQuery.data} />
      ) : (
        <EmptyState title="No wallet found" description="A wallet is created automatically on signup." />
      )}

      <div className="mt-10">
        <p className="kicker mb-3">Quick actions</p>
        <QuickActions />
      </div>

      <div className="mt-12">
        <div className="mb-5 flex items-center justify-between">
          <p className="kicker">Recent transactions</p>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/transactions">
              View all <ArrowRight weight="light" />
            </Link>
          </Button>
        </div>
        {transactionsQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <TransactionTable transactions={transactionsQuery.data?.items ?? []} />
        )}
      </div>
    </>
  );
}
