"use client";

import { useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
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
import { AuditCategoryBadge } from "@/components/features/audit/AuditCategoryBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuditLog } from "@/hooks/queries/use-audit-log";
import { formatDate } from "@/lib/format";
import type { AuditCategory } from "@/mocks/data/audit-log";

const CATEGORY_FILTERS: { value: AuditCategory | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "AUTH", label: "Auth" },
  { value: "PAYMENT", label: "Payment" },
  { value: "WALLET", label: "Wallet" },
  { value: "KYC", label: "KYC" },
  { value: "ADMIN", label: "Admin" },
];

const PAGE_SIZE = 12;

export default function AuditLogPage() {
  const [category, setCategory] = useState<AuditCategory | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isFetching } = useAuditLog({
    page,
    size: PAGE_SIZE,
    category: category === "ALL" ? undefined : category,
    q: debouncedSearch || undefined,
  });
  const hasNextPage = data ? (page + 1) * PAGE_SIZE < data.total : false;

  return (
    <>
      <PageHeader
        title="Audit Log"
        description="Immutable record of every action across the platform."
      />

      <div className="panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex flex-wrap rounded-lg border border-border p-0.5">
            {CATEGORY_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  setCategory(f.value);
                  setPage(0);
                }}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  category === f.value
                    ? "bg-surface-hover text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <MagnifyingGlass weight="light" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search actor, action, target…"
              className="pl-9"
            />
          </div>
        </div>

        {!data ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : data.items.length === 0 ? (
          <EmptyState title="No matching events" description="Try a different filter or search term." />
        ) : (
          <>
            <div className={cn("overflow-x-auto transition-opacity", isFetching && "opacity-60")}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>IP address</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.actor}</TableCell>
                      <TableCell>{entry.action}</TableCell>
                      <TableCell>
                        <AuditCategoryBadge category={entry.category} />
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {entry.target}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {entry.ipAddress}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(entry.createdAt)}
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
    </>
  );
}
