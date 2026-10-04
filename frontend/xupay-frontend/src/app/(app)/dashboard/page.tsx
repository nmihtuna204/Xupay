"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/layout/PageHeader";
import { WalletCard } from "@/components/features/wallets/WalletCard";
import { QuickActions } from "@/components/features/dashboard/QuickActions";
import { TransactionTable } from "@/components/features/payments/TransactionTable";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useWalletByUser } from "@/hooks/queries/use-wallet";
import { useTransactions } from "@/hooks/queries/use-transactions";
import { isNotFoundError } from "@/lib/api/errors";

export default function DashboardPage() {
  const auth = useAuth();
  const { user } = auth;
  const walletQuery = useWalletByUser(user?.id);
  const transactionsQuery = useTransactions({ userId: user?.id, page: 0, size: 5 });
  const walletMissing = walletQuery.isError && isNotFoundError(walletQuery.error);

  return (
    <>
      <PageHeader
        title={`Welcome back${user ? `, ${user.firstName}` : ""}`}
        description="Here's what's happening with your wallet."
      />

      {/* Balance hero — full width, the primary object on the page. Only a
          real "no wallet" answer shows the empty state; a failed request says
          so, and anything still resolving (including the user lookup the
          wallet query waits on) stays a skeleton. */}
      {walletQuery.data ? (
        <WalletCard wallet={walletQuery.data} />
      ) : auth.isError ? (
        <ErrorState title="Couldn't load your account" error={auth.error} onRetry={auth.retry} />
      ) : walletMissing ? (
        // Reached only when signup's automatic wallet creation failed (or the
        // account was made outside the app, like the bootstrapped admin), so
        // "a wallet is created automatically" was wrong exactly here - and the
        // page offered no way forward. The Wallets page has the create action.
        <EmptyState
          title="No wallet yet"
          description="Set one up to start sending and receiving money."
          action={
            <Button asChild className="mt-2">
              <Link href="/wallets">Set up your wallet</Link>
            </Button>
          }
        />
      ) : walletQuery.isError ? (
        <ErrorState title="Couldn't load your wallet" error={walletQuery.error} onRetry={() => walletQuery.refetch()} />
      ) : (
        <Skeleton className="h-52 rounded-xl" />
      )}

      <div className="mt-10">
        <p className="kicker mb-3">Quick actions</p>
        <QuickActions />
      </div>

      {/* Hidden when the account itself failed to load: the error above
          already says so, and a second one here would only repeat it. */}
      {!auth.isError && (
        <div className="mt-12">
          <div className="mb-5 flex items-center justify-between">
            <p className="kicker">Recent transactions</p>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/transactions">
                View all <ArrowRight weight="light" />
              </Link>
            </Button>
          </div>
          {transactionsQuery.data || isNotFoundError(transactionsQuery.error) ? (
            <TransactionTable transactions={transactionsQuery.data?.items ?? []} />
          ) : transactionsQuery.isError ? (
            <ErrorState
              title="Couldn't load your transactions"
              error={transactionsQuery.error}
              onRetry={() => transactionsQuery.refetch()}
            />
          ) : (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
