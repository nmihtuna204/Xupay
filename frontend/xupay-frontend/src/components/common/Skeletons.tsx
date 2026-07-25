import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Shared loading shapes for the app group.
 *
 * The point of these is that a skeleton should be the silhouette of the thing
 * that is coming, not a generic grey block: a table skeleton has the row count
 * and column widths of the table, a stat row has the same grid as the stats.
 * Centralising them is what stops nine pages inventing nine different waits.
 */

/** Mirrors PageHeader: title, description line, divider. */
export function PageHeaderSkeleton({ withAction = false }: { withAction?: boolean }) {
  return (
    <div className="mb-6 border-b border-hairline pb-5">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-72" />
        </div>
        {withAction && <Skeleton className="h-9 w-28 rounded-md" />}
      </div>
    </div>
  );
}

/** A panel-shaped block, for charts and forms whose height is known. */
export function PanelSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("rounded-xl", className ?? "h-64")} />;
}

/** One stat tile. `emphasis` matches StatCard so the swap is not a size jump. */
export function StatCardSkeleton({
  emphasis = "secondary",
}: {
  emphasis?: "primary" | "secondary";
}) {
  const primary = emphasis === "primary";
  return (
    <div className={cn("panel", primary ? "p-6" : "p-panel")}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className={cn("mt-3", primary ? "h-9 w-48" : "h-6 w-28")} />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}

/**
 * A stat row with a lead tile plus supporting tiles, matching the dashboard's
 * hierarchy rather than a row of identical squares.
 */
export function StatRowSkeleton({ secondary = 3 }: { secondary?: number }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-3">
        <StatCardSkeleton emphasis="primary" />
      </div>
      {Array.from({ length: secondary }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Table silhouette. Column widths are staggered so it reads as tabular data
 * instead of a uniform grid, and the last column is right-aligned like an
 * amount column.
 */
export function TableSkeleton({
  rows = 6,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  const widths = ["w-20", "w-40", "w-28", "w-24", "w-24", "w-16"];
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center gap-6 border-b border-hairline px-4 py-3">
        {Array.from({ length: columns }).map((_, c) => (
          <Skeleton
            key={c}
            className={cn("h-3", widths[c % widths.length], c === columns - 1 && "ml-auto")}
          />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-6 border-b border-hairline px-4 py-3.5 last:border-0"
        >
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton
              key={c}
              className={cn("h-4", widths[c % widths.length], c === columns - 1 && "ml-auto")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Detail-panel silhouette: a grid of key/value pairs. */
export function DetailGridSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div className="panel grid gap-x-8 gap-y-6 p-6 sm:grid-cols-2">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-4 w-36" />
        </div>
      ))}
    </div>
  );
}
