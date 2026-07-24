"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import { CHART_INK } from "./chart-colors";

export interface SeriesDef {
  key: string;
  name: string;
  color: string;
}

/**
 * Multi-series time area chart. Series render as translucent fills with 2px
 * strokes; each series keeps a fixed color (assigned by the caller in order).
 */
export function TimeSeriesAreaChart({
  data,
  series,
  xKey,
  height = 260,
  valueFormatter,
  labelFormatter,
}: {
  data: Record<string, string | number>[];
  series: SeriesDef[];
  xKey: string;
  height?: number;
  valueFormatter?: (v: number) => string;
  labelFormatter?: (l: string | number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke={CHART_INK.grid} strokeDasharray="0" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fill: CHART_INK.axis, fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: CHART_INK.grid }}
          tickFormatter={labelFormatter ? (v) => labelFormatter(v) : undefined}
          minTickGap={24}
        />
        <YAxis
          tick={{ fill: CHART_INK.axis, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={valueFormatter ? (v) => valueFormatter(v as number) : undefined}
        />
        <Tooltip
          cursor={{ stroke: CHART_INK.axis, strokeWidth: 1 }}
          content={({ active, label, payload }) => (
            <ChartTooltip
              active={active}
              label={label}
              payload={payload}
              formatter={valueFormatter}
              labelFormatter={labelFormatter}
            />
          )}
        />
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            fill={`url(#grad-${s.key})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
