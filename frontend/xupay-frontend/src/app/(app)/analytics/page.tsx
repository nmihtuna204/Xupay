"use client";

import { useState } from "react";
import { ArrowsLeftRight, Pulse, TrendUp, Users } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { ChartCard } from "@/components/features/charts/ChartCard";
import { TimeSeriesAreaChart } from "@/components/features/charts/TimeSeriesAreaChart";
import { HorizontalBarChart } from "@/components/features/charts/HorizontalBarChart";
import { RangeToggle } from "@/components/features/analytics/RangeToggle";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics } from "@/hooks/queries/use-analytics";
import { SERIES_COLORS, CATEGORICAL } from "@/components/features/charts/chart-colors";
import {
  formatCompactCurrencyFromCents,
  formatCompactNumber,
  formatCurrencyFromCents,
  formatDateShort,
} from "@/lib/format";

export default function AnalyticsPage() {
  const [range, setRange] = useState("30d");
  const { data, isLoading } = useAnalytics(range);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Platform-wide payment volume and activity."
        action={<RangeToggle value={range} onChange={setRange} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading || !data ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <StatCard
              label="Total volume"
              value={formatCompactCurrencyFromCents(data.totalVolumeCents)}
              icon={TrendUp}
            />
            <StatCard
              label="Transactions"
              value={formatCompactNumber(data.transactionCount)}
              icon={ArrowsLeftRight}
            />
            <StatCard
              label="Active users"
              value={formatCompactNumber(data.activeUsers)}
              icon={Users}
            />
            <StatCard
              label="Avg. transaction"
              value={formatCurrencyFromCents(data.avgTransactionCents)}
              icon={Pulse}
            />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Payment volume over time"
          description={`Daily processed volume · last ${range}`}
          className="lg:col-span-2"
        >
          {isLoading || !data ? (
            <Skeleton className="h-[260px] w-full" />
          ) : (
            <TimeSeriesAreaChart
              data={data.volumeByDay}
              xKey="date"
              series={[{ key: "volumeCents", name: "Volume", color: SERIES_COLORS.blue }]}
              valueFormatter={(v) => formatCompactCurrencyFromCents(v)}
              labelFormatter={(l) => formatDateShort(String(l))}
            />
          )}
        </ChartCard>

        <ChartCard title="Volume by type" description="Share of processed volume">
          {isLoading || !data ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <HorizontalBarChart
              data={data.volumeByType.map((t, i) => ({
                label: t.type,
                value: t.volumeCents,
                color: CATEGORICAL[i],
              }))}
              valueFormatter={(v) => formatCompactCurrencyFromCents(v)}
            />
          )}
        </ChartCard>
      </div>

      <div className="mt-6">
        <ChartCard title="Top corridors" description="Where money moves across the platform">
          {isLoading || !data ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <HorizontalBarChart
              height={200}
              data={data.topCorridors.map((c) => ({
                label: c.corridor,
                value: c.volumeCents,
                color: SERIES_COLORS.blue,
              }))}
              valueFormatter={(v) => formatCompactCurrencyFromCents(v)}
            />
          )}
        </ChartCard>
      </div>
    </>
  );
}
