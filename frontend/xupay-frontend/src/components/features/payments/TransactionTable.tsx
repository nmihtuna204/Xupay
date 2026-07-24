import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { TransactionStatusBadge } from "./TransactionStatusBadge";
import { formatCurrencyFromCents, formatDate } from "@/lib/format";
import type { TransactionDetailResponse } from "@/lib/api/payment-service/payments";

export function TransactionTable({
  transactions,
}: {
  transactions: TransactionDetailResponse[];
}) {
  if (transactions.length === 0) {
    return <EmptyState title="No transactions yet" description="Transfers, deposits, and withdrawals will show up here." />;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.transactionId} className="cursor-pointer">
              <TableCell className="font-medium capitalize">
                <Link href={`/transactions/${tx.transactionId}`} className="hover:underline">
                  {tx.type?.toLowerCase() || "transfer"}
                </Link>
              </TableCell>
              <TableCell className="max-w-56 truncate text-muted-foreground">
                {tx.description || "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(tx.createdAt)}</TableCell>
              <TableCell>
                <TransactionStatusBadge status={tx.status} />
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatCurrencyFromCents(tx.amountCents, tx.currency)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
