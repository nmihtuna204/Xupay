"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { TransactionTable } from "@/components/features/payments/TransactionTable";
import { PaginationControls } from "@/components/common/PaginationControls";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useTransactions } from "@/hooks/queries/use-transactions";

const PAGE_SIZE = 10;

export function TransactionsClient() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") ?? 0);

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
      <div className="panel p-6">
        {transactionsQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <>
            <TransactionTable transactions={items} />
            <PaginationControls page={page} hasNextPage={hasNextPage} onPageChange={goToPage} />
          </>
        )}
      </div>
    </>
  );
}
