"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import { CHART_INK } from "./chart-colors";

export interface BarDatum {
  label: string;
  value: number;
  color: string;
}

/**
 * Horizontal bars for a small categorical breakdown. Each bar carries its own
 * fixed color; rounded data-end anchored to the baseline. A 2px surface gap
 * between bars comes from barCategoryGap.
 */
export function HorizontalBarChart({
  data,
  height = 220,
  valueFormatter,
}: {
  data: BarDatum[];
  height?: number;
  valueFormatter?: (v: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
        barCategoryGap="28%"
      >
        <XAxis
          type="number"
          hide
          tickFormatter={valueFormatter ? (v) => valueFormatter(v as number) : undefined}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fill: CHART_INK.axis, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={130}
        />
        <Tooltip
          // Ink, not white: the hover band was invisible on the light surface.
          cursor={{ fill: CHART_INK.cursor }}
          content={({ active, label, payload }) => (
            <ChartTooltip
              active={active}
              label={label}
              payload={payload}
              formatter={valueFormatter}
            />
          )}
        />
        <Bar dataKey="value" name="Value" radius={[0, 4, 4, 0]} isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.label} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
