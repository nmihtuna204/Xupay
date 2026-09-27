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
import { formatCurrencyFromCents, formatDate, formatDateShort } from "@/lib/format";
import type { TransactionDetailResponse } from "@/lib/api/payment-service/payments";

export function TransactionTable({
  transactions,
}: {
  transactions: TransactionDetailResponse[];
}) {
  if (transactions.length === 0) {
    return <EmptyState title="No transactions yet" description="Transfers, deposits, and withdrawals will show up here." />;
  }

  // On a phone the table keeps the three columns that answer "what happened to
  // my money" - type, status, amount - and folds the date under the type.
  // Description and the full date column come back as the width allows,
  // instead of the whole table scrolling sideways and hiding the amount.
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead className="hidden md:table-cell">Description</TableHead>
            <TableHead className="hidden sm:table-cell">Date</TableHead>
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
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground sm:hidden">
                  {formatDateShort(tx.createdAt)}
                </span>
              </TableCell>
              <TableCell className="hidden max-w-56 truncate text-muted-foreground md:table-cell">
                {tx.description || "-"}
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {formatDate(tx.createdAt)}
              </TableCell>
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
