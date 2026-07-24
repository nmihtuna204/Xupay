"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/PageHeader";
import { PaginationControls } from "@/components/common/PaginationControls";
import { SarStatusBadge } from "@/components/features/compliance/SarStatusBadge";
import { SarDetailDialog } from "@/components/features/compliance/SarDetailDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useSarReports } from "@/hooks/queries/use-compliance";
import { formatCurrencyFromCents, formatDateShort } from "@/lib/format";
import type { SarStatus } from "@/mocks/data/compliance";

const STATUS_FILTERS: { value: SarStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "CLOSED", label: "Closed" },
];

const PAGE_SIZE = 10;

export default function CompliancePage() {
  const [status, setStatus] = useState<SarStatus | "ALL">("ALL");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isFetching } = useSarReports({
    page,
    size: PAGE_SIZE,
    status: status === "ALL" ? undefined : status,
  });
  const hasNextPage = data ? (page + 1) * PAGE_SIZE < data.total : false;

  return (
    <>
      <PageHeader
        title="Compliance / SAR"
        description="Suspicious Activity Reports filed by the compliance team."
      />

      <div className="glass-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex flex-wrap rounded-lg border border-border p-0.5">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  setStatus(f.value);
                  setPage(0);
                }}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  status === f.value
                    ? "bg-surface-hover text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          {data && (
            <p className="text-xs text-muted-foreground">{data.total} reports</p>
          )}
        </div>

        {!data ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className={cn("overflow-x-auto transition-opacity", isFetching && "opacity-60")}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Filed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((report) => (
                    <TableRow
                      key={report.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedId(report.id)}
                    >
                      <TableCell className="font-mono text-xs">{report.reference}</TableCell>
                      <TableCell className="font-medium">{report.subjectName}</TableCell>
                      <TableCell className="max-w-[240px] truncate text-muted-foreground">
                        {report.reason}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrencyFromCents(report.totalAmountCents)}
                      </TableCell>
                      <TableCell>
                        <SarStatusBadge status={report.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDateShort(report.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <PaginationControls page={page} hasNextPage={hasNextPage} onPageChange={setPage} />
          </>
        )}
      </div>

      <SarDetailDialog
        reportId={selectedId}
        open={selectedId !== null}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </>
  );
}
