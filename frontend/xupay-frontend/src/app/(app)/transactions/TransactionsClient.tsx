"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { TransactionTable } from "@/components/features/payments/TransactionTable";
import { PaginationControls } from "@/components/common/PaginationControls";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { useAuth } from "@/hooks/use-auth";
import { useTransactions } from "@/hooks/queries/use-transactions";
import { isNotFoundError } from "@/lib/api/errors";

const PAGE_SIZE = 10;

/**
 * The zero-based page from `?page=`. Anything else - "abc", "-3", "1.5" -
 * is page 0: Number() alone gave NaN ("Page NaN", a 400 from the API) or a
 * negative page whose Previous button kept counting down.
 */
export function parsePage(value: string | null): number {
  const page = Number(value ?? 0);
  return Number.isInteger(page) && page > 0 ? page : 0;
}

export function TransactionsClient() {
  const auth = useAuth();
  const { user } = auth;
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parsePage(searchParams.get("page"));

  const transactionsQuery = useTransactions({ userId: user?.id, page, size: PAGE_SIZE });
  const items = transactionsQuery.data?.items ?? [];
  const total = transactionsQuery.data?.total;
  const hasNextPage =
    total !== undefined ? (page + 1) * PAGE_SIZE < total : items.length === PAGE_SIZE;

  function goToPage(next: number) {
    router.push(`/transactions?page=${next}`);
  }

  return (
    <>
      <PageHeader title="Transactions" description="Every transfer, deposit, and withdrawal on your wallet." />
      <div className="panel p-4 sm:p-6">
        {transactionsQuery.data || isNotFoundError(transactionsQuery.error) ? (
          <>
            <TransactionTable transactions={items} />
            <PaginationControls page={page} hasNextPage={hasNextPage} onPageChange={goToPage} />
          </>
        ) : auth.isError ? (
          <ErrorState title="Couldn't load your account" error={auth.error} onRetry={auth.retry} />
        ) : transactionsQuery.isError ? (
          <ErrorState
            title="Couldn't load your transactions"
            error={transactionsQuery.error}
            onRetry={() => transactionsQuery.refetch()}
          />
        ) : (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
