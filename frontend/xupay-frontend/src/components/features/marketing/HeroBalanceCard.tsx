import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

/**
 * A real mini preview of the XuPay wallet card — same surfaces, type and
 * money formatting as the live dashboard. This is a genuine component
 * preview, not a div-based fake screenshot: it renders the actual visual
 * language of the product so the hero shows what XuPay looks like.
 */
const ROWS = [
  { label: "Salary deposit", amount: "+2,500,000", up: true },
  { label: "An Nguyen", amount: "-150,000", up: false },
  { label: "Coffee", amount: "-52,000", up: false },
];

export function HeroBalanceCard() {
  return (
    <div className="relative">
      {/* Soft accent glow behind the card (depth, not decoration). */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 -z-10 rounded-[2rem] bg-[radial-gradient(60%_60%_at_60%_30%,color-mix(in_oklab,var(--accent-from)_28%,transparent),transparent_70%)] blur-2xl"
      />
      <div className="w-[min(88vw,26rem)] rounded-2xl border border-white/[0.08] bg-surface-2/80 p-7 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        <p className="kicker">Wallet balance</p>
        <p className="figure-lg mt-3 text-[2.75rem] leading-none">₫11,847,920</p>

        <div className="mt-7 flex flex-col divide-y divide-white/[0.06]">
          {ROWS.map((row) => (
            <div key={row.label} className="flex items-center justify-between py-3">
              <span className="flex items-center gap-2.5 text-sm text-foreground/80">
                <span
                  className={`flex size-7 items-center justify-center rounded-full ${
                    row.up ? "bg-success/10 text-success" : "bg-white/[0.05] text-muted-foreground"
                  }`}
                >
                  {row.up ? (
                    <ArrowDownLeft className="size-3.5" />
                  ) : (
                    <ArrowUpRight className="size-3.5" />
                  )}
                </span>
                {row.label}
              </span>
              <span
                className={`font-mono text-sm tabular-nums ${
                  row.up ? "text-success" : "text-foreground/80"
                }`}
              >
                {row.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
