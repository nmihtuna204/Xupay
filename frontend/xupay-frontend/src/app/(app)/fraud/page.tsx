"use client";

import { useState } from "react";
import { ShieldAlert, ShieldCheck, ShieldX, Gauge } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { ChartCard } from "@/components/features/charts/ChartCard";
import { ChartLegend } from "@/components/features/charts/ChartLegend";
import { TimeSeriesAreaChart } from "@/components/features/charts/TimeSeriesAreaChart";
import { HorizontalBarChart } from "@/components/features/charts/HorizontalBarChart";
import { FraudAlertsTable } from "@/components/features/fraud/FraudAlertsTable";
import { PaginationControls } from "@/components/common/PaginationControls";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useFraudMetrics, useFraudAlerts } from "@/hooks/queries/use-fraud";
import { SERIES_COLORS, STATUS_COLORS } from "@/components/features/charts/chart-colors";
import { formatCompactNumber, formatPercent, formatDateShort } from "@/lib/format";
import type { RiskLevel } from "@/mocks/data/fraud";

const RISK_FILTERS: { value: RiskLevel | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

const LEVEL_COLOR: Record<RiskLevel, string> = {
  LOW: STATUS_COLORS.good,
  MEDIUM: STATUS_COLORS.warning,
  HIGH: STATUS_COLORS.serious,
  CRITICAL: STATUS_COLORS.critical,
};

const PAGE_SIZE = 10;
const TREND_SERIES = [
  { key: "flagged", name: "Flagged", color: SERIES_COLORS.blue },
  { key: "blocked", name: "Blocked", color: SERIES_COLORS.orange },
];

export default function FraudPage() {
  const [riskLevel, setRiskLevel] = useState<RiskLevel | "ALL">("ALL");
  const [page, setPage] = useState(0);

  const metricsQuery = useFraudMetrics();
  const alertsQuery = useFraudAlerts({
    page,
    size: PAGE_SIZE,
    riskLevel: riskLevel === "ALL" ? undefined : riskLevel,
  });

  const metrics = metricsQuery.data;
  const alerts = alertsQuery.data;
  const hasNextPage = alerts ? (page + 1) * PAGE_SIZE < alerts.total : false;

  return (
    <>
      <PageHeader
        title="Fraud Detection"
        description="Real-time risk scoring across all transactions."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {!metrics ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <StatCard
              label="Transactions evaluated"
              value={formatCompactNumber(metrics.totalEvaluated)}
              icon={Gauge}
            />
            <StatCard
              label="Flagged"
              value={formatCompactNumber(metrics.flagged)}
              icon={ShieldAlert}
              tone="warning"
            />
            <StatCard
              label="Blocked"
              value={formatCompactNumber(metrics.blocked)}
              icon={ShieldX}
              tone="critical"
            />
            <StatCard
              label="False-positive rate"
              value={formatPercent(metrics.falsePositiveRate)}
              icon={ShieldCheck}
              tone="success"
            />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Flagged vs blocked"
          description="Last 14 days"
          className="lg:col-span-2"
          action={<ChartLegend items={TREND_SERIES} />}
        >
          {!metrics ? (
            <Skeleton className="h-[260px] w-full" />
          ) : (
            <TimeSeriesAreaChart
              data={metrics.trend}
              xKey="date"
              series={TREND_SERIES}
              valueFormatter={(v) => formatCompactNumber(v)}
              labelFormatter={(l) => formatDateShort(String(l))}
            />
          )}
        </ChartCard>

        <ChartCard title="Alerts by risk level" description="Current flagged population">
          {!metrics ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <HorizontalBarChart
              data={metrics.byLevel.map((l) => ({
                label: l.level.charAt(0) + l.level.slice(1).toLowerCase(),
                value: l.count,
                color: LEVEL_COLOR[l.level],
              }))}
              valueFormatter={(v) => formatCompactNumber(v)}
            />
          )}
        </ChartCard>
      </div>

      <div className="mt-6 glass-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Recent alerts</h3>
          <div className="inline-flex rounded-lg border border-border p-0.5">
            {RISK_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  setRiskLevel(f.value);
                  setPage(0);
                }}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  riskLevel === f.value
                    ? "bg-surface-hover text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {!alerts ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <>
            <FraudAlertsTable alerts={alerts.items} />
            <PaginationControls page={page} hasNextPage={hasNextPage} onPageChange={setPage} />
          </>
        )}
      </div>
    </>
  );
}
