"use client";

import { useState } from "react";
import { Check, Minus } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { formatCurrencyFromCents } from "@/lib/format";

/**
 * The stage card under the hero: XuPay's KYC tiers in the reference's
 * pricing-card layout (docs/design/spec.md §6).
 *
 * XuPay sells no plans, so nothing here is a price. The figures are the
 * product's real per-tier caps: counts from the `transaction_limits` seed in
 * infrastructure/db/user-service/V1__complete_user_schema.sql, daily send caps
 * (VND cents) from backend/user-service/.../db/migration/V3__vnd_transaction_limits.sql.
 * Change them there and here together.
 */
const TIERS = [
  { tier: "TIER_1", name: "Basic", perDay: 20, perHour: 5, dailySendCents: 2_500_000_000, international: false, merchant: true },
  { tier: "TIER_2", name: "Verified", perDay: 50, perHour: 10, dailySendCents: 25_000_000_000, international: true, merchant: true },
  { tier: "TIER_3", name: "Premium", perDay: 200, perHour: 50, dailySendCents: 250_000_000_000, international: true, merchant: true },
] as const;

const FEATURED = "TIER_2";

type Period = "day" | "hour";

export function TierLimits() {
  const [period, setPeriod] = useState<Period>("day");

  return (
    <div className="glass-stage mx-auto w-full max-w-[1000px] px-5 pb-6 pt-12 sm:px-8 sm:pb-8 sm:pt-14">
      <div className="mx-auto max-w-[560px] text-center">
        <h2 className="text-[1.75rem] font-medium leading-tight tracking-[-0.02em] text-foreground">
          Tiered limits
        </h2>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-body-foreground">
          Verification unlocks higher transaction and volume limits.
        </p>
      </div>

      <div className="mt-7 flex justify-center">
        <div role="radiogroup" aria-label="Limit period" className="segmented">
          {(["day", "hour"] as const).map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={period === p}
              data-active={period === p}
              onClick={() => setPeriod(p)}
              className="segmented__item"
            >
              Per {p}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-9 grid gap-4 md:grid-cols-3">
        {TIERS.map((t) => {
          const featured = t.tier === FEATURED;
          const count = period === "day" ? t.perDay : t.perHour;
          return (
            <div key={t.tier} className={cn("plan-card flex flex-col p-6", featured && "plan-card--featured")}>
              <p className={cn("text-sm font-medium", featured ? "text-primary-accent" : "text-body-foreground")}>
                {t.name}
              </p>
              <p className="mt-5 flex items-baseline gap-2">
                <span className="text-[2.75rem] font-light leading-none tracking-[-0.04em] text-foreground tabular-nums">
                  {count}
                </span>
                <span className="text-sm text-muted-foreground">transfers / {period}</span>
              </p>
              <ul className="mt-6 space-y-2.5 border-t border-hairline pt-5 text-sm">
                <Feature on>Send up to {formatCurrencyFromCents(t.dailySendCents)} a day</Feature>
                <Feature on={t.merchant}>Receive merchant payments</Feature>
                <Feature on={t.international}>Send internationally</Feature>
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Feature({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <li className={cn("flex items-center gap-2.5", on ? "text-body-foreground" : "text-muted-foreground")}>
      {on ? (
        <Check weight="bold" className="size-3.5 shrink-0 text-primary-accent" aria-hidden />
      ) : (
        <Minus weight="bold" className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      )}
      <span className={on ? undefined : "line-through decoration-hairline-strong"}>{children}</span>
      <span className="sr-only">{on ? "(included)" : "(not included)"}</span>
    </li>
  );
}
