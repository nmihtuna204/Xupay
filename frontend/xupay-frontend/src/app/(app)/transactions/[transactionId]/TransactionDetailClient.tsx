"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { DetailField } from "@/components/common/DetailField";
import { TransactionStatusBadge } from "@/components/features/payments/TransactionStatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { formatCurrencyFromCents, formatDate } from "@/lib/format";
import { useTransaction } from "@/hooks/queries/use-transactions";
import { isNotFoundError } from "@/lib/api/errors";

export function TransactionDetailClient({ transactionId }: { transactionId: string }) {
  const txQuery = useTransaction(transactionId);

  if (!txQuery.data) {
    return (
      <>
        <PageHeader title="Transaction" />
        {txQuery.isError && isNotFoundError(txQuery.error) ? (
          <EmptyState title="Transaction not found" />
        ) : txQuery.isError ? (
          <ErrorState
            title="Couldn't load this transaction"
            error={txQuery.error}
            onRetry={() => txQuery.refetch()}
          />
        ) : (
          <Skeleton className="h-64 rounded-xl" />
        )}
      </>
    );
  }

  const tx = txQuery.data;

  return (
    <>
      <PageHeader title="Transaction details" />
      <div className="panel max-w-2xl p-6">
        <div className="flex items-start justify-between">
          <p className="figure-lg text-3xl">{formatCurrencyFromCents(tx.amountCents, tx.currency)}</p>
          <TransactionStatusBadge status={tx.status} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6">
          <DetailField label="Transaction ID" value={tx.transactionId} />
          <DetailField label="Type" value={<span className="capitalize">{tx.type?.toLowerCase() || "transfer"}</span>} />
          <DetailField label="Date" value={formatDate(tx.createdAt)} />
          <DetailField label="Currency" value={tx.currency} />
          <DetailField label="Description" value={tx.description || "-"} />
        </div>
      </div>
    </>
  );
}
