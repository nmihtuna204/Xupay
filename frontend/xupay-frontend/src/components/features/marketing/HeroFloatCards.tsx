import { ArrowDownLeft, Check, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { formatCurrencyFromCents } from "@/lib/format";

/**
 * The mini-cards that orbit the hero - the single strongest signature of the
 * Agio reference. Glass, tilted a degree or two off-grid, drifting slowly.
 *
 * They are decoration, so they are aria-hidden and pointer-events-none: a
 * screen reader should hear the headline and the CTA, not four numbers with no
 * context. They are also hidden below lg, where they would either collide with
 * the headline or force the hero past the fold.
 *
 * Positions are deliberately uneven. A symmetrical ring of four reads as a
 * diagram; an uneven scatter reads as depth.
 */
export function HeroFloatCards() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
      {/* Upper left - an incoming credit. */}
      <div className="float-card absolute left-[3%] top-[22%] -rotate-3 px-4 py-3 xl:left-[7%]">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-success/12">
            <ArrowDownLeft weight="light" className="size-4 text-success" />
          </span>
          <div>
            <p className="font-mono text-sm tabular-nums text-foreground">
              {formatCurrencyFromCents(250_000_000)}
            </p>
            <p className="field-label mt-0.5">Salary deposit</p>
          </div>
        </div>
      </div>

      {/* Lower left - the ledger claim, stated as a number. */}
      <div className="float-card float-card--slow absolute left-[6%] top-[63%] rotate-2 px-4 py-3 xl:left-[11%]">
        <p className="font-mono text-sm tabular-nums text-foreground">0.00 drift</p>
        <p className="field-label mt-0.5">Double-entry reconciled</p>
      </div>

      {/* Upper right - risk scoring. */}
      <div className="float-card float-card--delayed absolute right-[4%] top-[30%] rotate-3 px-4 py-3 xl:right-[8%]">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck weight="light" className="size-4 text-primary-accent" />
          </span>
          <div>
            <p className="font-mono text-sm tabular-nums text-foreground">Risk 04 / 100</p>
            <p className="field-label mt-0.5">Scored before send</p>
          </div>
        </div>
      </div>

      {/* Lower right - settlement confirmation. */}
      <div className="float-card absolute right-[7%] top-[68%] -rotate-2 px-4 py-3 xl:right-[12%]">
        <div className="flex items-center gap-2.5">
          <span className="flex size-6 items-center justify-center rounded-full bg-success/12">
            <Check weight="light" className="size-3.5 text-success" />
          </span>
          <p className="text-sm font-medium text-foreground">Settled</p>
        </div>
      </div>
    </div>
  );
}
