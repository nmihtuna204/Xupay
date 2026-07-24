"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DetailField } from "@/components/common/DetailField";
import { SarStatusBadge } from "./SarStatusBadge";
import { formatCurrencyFromCents, formatDate } from "@/lib/format";
import { useSarReport } from "@/hooks/queries/use-compliance";
import { Skeleton } from "@/components/ui/skeleton";

export function SarDetailDialog({
  reportId,
  open,
  onOpenChange,
}: {
  reportId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading } = useSarReport(reportId ?? "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Suspicious Activity Report</DialogTitle>
        </DialogHeader>
        {isLoading || !data ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-sm">{data.reference}</p>
              <SarStatusBadge status={data.status} />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <DetailField label="Subject" value={data.subjectName} />
              <DetailField label="Filed by" value={data.filedBy} />
              <DetailField
                label="Total amount"
                value={formatCurrencyFromCents(data.totalAmountCents)}
              />
              <DetailField label="Transactions" value={data.transactionCount} />
              <DetailField label="Filed" value={formatDate(data.createdAt)} />
            </div>
            <DetailField label="Reason for filing" value={data.reason} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
