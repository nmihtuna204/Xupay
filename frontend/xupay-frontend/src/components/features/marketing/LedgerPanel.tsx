"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { cn } from "@/lib/utils";
import { formatCurrencyFromCents, moneyFormatOptions } from "@/lib/format";

/** Minor units, exactly as the payment service returns them. */
const ROWS = [
  { label: "Deposit · Salary", amountCents: 250_000_000 },
  { label: "Transfer · An Nguyen", amountCents: -15_000_000 },
  { label: "Withdrawal · ATM", amountCents: -50_000_000 },
  { label: "Deposit · Refund", amountCents: 32_000_000 },
];

const TARGET_CENTS = 1_184_792_000;

/**
 * Animated ledger. When it scrolls into view the balance counts up (via
 * NumberFlow) and the rows stagger in. `useInView` (framer-motion) owns the
 * IntersectionObserver, so there's no manual effect/setState here; NumberFlow
 * and the CSS transitions both collapse to their final state under reduced
 * motion.
 *
 * NumberFlow takes Intl options rather than a finished string, so it is handed
 * the shared moneyFormatOptions() the rest of the app formats with. That keeps
 * the animated figure identical to formatCurrencyFromCents output.
 */
export function LedgerPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const active = useInView(ref, { once: true, amount: 0.4 });

  return (
    <div ref={ref} className="panel p-7 sm:p-8">
      <p className="kicker">Balance</p>
      <p className="figure-lg mt-3 text-[clamp(1.875rem,4.5vw,2.75rem)] leading-none">
        <NumberFlow
          value={active ? TARGET_CENTS / 100 : 0}
          locales="en-US"
          format={moneyFormatOptions()}
        />
      </p>

      <div className="mt-8 flex flex-col divide-y divide-white/[0.06]">
        {ROWS.map((row, i) => {
          const credit = row.amountCents > 0;
          return (
            <div
              key={row.label}
              className={cn(
                "flex items-center justify-between gap-3 py-3.5 text-sm transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                active ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
              )}
              style={{ transitionDelay: `${150 + i * 90}ms` }}
            >
              <span className="text-muted-foreground">{row.label}</span>
              <span
                className={cn(
                  "font-mono tabular-nums",
                  credit ? "text-success" : "text-foreground/85"
                )}
              >
                {formatCurrencyFromCents(row.amountCents)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
