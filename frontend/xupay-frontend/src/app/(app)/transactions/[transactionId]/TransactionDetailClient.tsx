"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { DetailField } from "@/components/common/DetailField";
import { TransactionStatusBadge } from "@/components/features/payments/TransactionStatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { formatCurrencyFromCents, formatDate } from "@/lib/format";
import { useTransaction } from "@/hooks/queries/use-transactions";

export function TransactionDetailClient({ transactionId }: { transactionId: string }) {
  const txQuery = useTransaction(transactionId);

  if (txQuery.isLoading) {
    return (
      <>
        <PageHeader title="Transaction" />
        <Skeleton className="h-64 rounded-2xl" />
      </>
    );
  }

  if (!txQuery.data) {
    return (
      <>
        <PageHeader title="Transaction" />
        <EmptyState title="Transaction not found" />
      </>
    );
  }

  const tx = txQuery.data;

  return (
    <>
      <PageHeader title="Transaction details" />
      <div className="glass-card max-w-2xl p-6">
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
