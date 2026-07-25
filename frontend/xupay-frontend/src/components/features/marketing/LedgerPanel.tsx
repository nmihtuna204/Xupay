"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { cn } from "@/lib/utils";

const ROWS = [
  { label: "Deposit · Salary", amount: 2_500_000, credit: true },
  { label: "Transfer · An Nguyen", amount: -150_000, credit: false },
  { label: "Withdrawal · ATM", amount: -500_000, credit: false },
  { label: "Deposit · Refund", amount: 320_000, credit: true },
];

const TARGET = 11_847_920;

/**
 * Animated ledger. When it scrolls into view the balance counts up (via
 * NumberFlow) and the rows stagger in. `useInView` (framer-motion) owns the
 * IntersectionObserver, so there's no manual effect/setState here; NumberFlow
 * and the CSS transitions both collapse to their final state under reduced
 * motion.
 */
export function LedgerPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const active = useInView(ref, { once: true, amount: 0.4 });

  return (
    <div ref={ref} className="rounded-2xl border border-white/[0.08] bg-surface-2 p-7 sm:p-8">
      <p className="kicker">Balance</p>
      <p className="figure-lg mt-3 text-[clamp(2.25rem,5vw,3.25rem)] leading-none">
        <span className="text-muted-foreground">₫</span>
        <NumberFlow value={active ? TARGET : 0} />
      </p>

      <div className="mt-8 flex flex-col divide-y divide-white/[0.06]">
        {ROWS.map((row, i) => (
          <div
            key={row.label}
            className={cn(
              "flex items-center justify-between py-3.5 text-sm transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
              active ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
            )}
            style={{ transitionDelay: `${150 + i * 90}ms` }}
          >
            <span className="text-muted-foreground">{row.label}</span>
            <span
              className={cn(
                "font-mono tabular-nums",
                row.credit ? "text-success" : "text-foreground/85"
              )}
            >
              {row.credit ? "+" : "-"}
              {Math.abs(row.amount).toLocaleString("en-US")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
