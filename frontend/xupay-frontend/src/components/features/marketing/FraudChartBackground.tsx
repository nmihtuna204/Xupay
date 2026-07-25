"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";

// Deterministic risk-score curve — stable across renders, no fake precision
// implied (it is clearly decorative background data).
const DATA = [
  18, 22, 19, 34, 28, 41, 37, 52, 44, 63, 58, 71, 49, 66, 55, 78, 61, 84, 59, 72,
].map((v, i) => ({ i, v }));

/**
 * Full-bleed decorative area chart behind the fraud section. Uses the
 * validated colorblind-safe chart-1 blue; kept faint so foreground copy stays
 * legible. Non-interactive and animation-free.
 */
export function FraudChartBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={DATA} margin={{ top: 40, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="fraudArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3987e5" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#3987e5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke="#3987e5"
            strokeWidth={2}
            fill="url(#fraudArea)"
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
