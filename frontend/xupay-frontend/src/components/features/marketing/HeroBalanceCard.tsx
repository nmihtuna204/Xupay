import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatCurrencyFromCents } from "@/lib/format";

/**
 * A real mini preview of the XuPay wallet card. To earn that description it
 * has to match the live dashboard rather than approximate it, so it uses the
 * same surface (.glass-card, like WalletCard), the same money formatter
 * (formatCurrencyFromCents, so amounts carry the symbol and both decimals),
 * and the same row treatment as TransactionTable (font-mono tabular-nums).
 *
 * No backdrop blur: globals.css reserves blur for floating overlays, and an
 * in-page card is a flat surface with a single hairline border.
 */

/** Balances are minor units, exactly as the payment service returns them. */
const BALANCE_CENTS = 1_184_792_000;

const ROWS = [
  { label: "Salary deposit", amountCents: 250_000_000 },
  { label: "An Nguyen", amountCents: -15_000_000 },
  { label: "Coffee", amountCents: -5_200_000 },
];

export function HeroBalanceCard() {
  return (
    <div className="relative">
      {/* Soft accent glow behind the card (depth, not decoration). */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 -z-10 rounded-[2rem] bg-[radial-gradient(60%_60%_at_60%_30%,color-mix(in_oklab,var(--accent-from)_28%,transparent),transparent_70%)] blur-2xl"
      />
      <div className="glass-card w-[min(88vw,26rem)] p-8 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.7)]">
        <p className="kicker">Wallet balance</p>
        {/* Clamped rather than a magic px value. The ceiling is lower than
            WalletCard's 4.5rem because this card is 26rem wide, not a
            full dashboard column, and the 2-decimal string is 14 glyphs. */}
        <p className="figure-lg mt-4 text-[clamp(1.75rem,4.5vw,2.5rem)] leading-none">
          {formatCurrencyFromCents(BALANCE_CENTS)}
        </p>

        <div className="mt-7 flex flex-col divide-y divide-white/[0.06]">
          {ROWS.map((row) => {
            const credit = row.amountCents > 0;
            return (
              <div key={row.label} className="flex items-center justify-between gap-3 py-3">
                <span className="flex items-center gap-2.5 text-sm text-foreground/80">
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                      credit ? "bg-success/10 text-success" : "bg-white/[0.05] text-muted-foreground"
                    }`}
                  >
                    {credit ? (
                      <ArrowDownLeft className="size-3.5" />
                    ) : (
                      <ArrowUpRight className="size-3.5" />
                    )}
                  </span>
                  {row.label}
                </span>
                <span
                  className={`font-mono text-sm tabular-nums ${
                    credit ? "text-success" : "text-foreground/80"
                  }`}
                >
                  {formatCurrencyFromCents(row.amountCents)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
