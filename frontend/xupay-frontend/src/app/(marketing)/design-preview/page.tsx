import { ArrowUpRight, Check } from "@phosphor-icons/react/dist/ssr";
import { formatCurrencyFromCents } from "@/lib/format";

/**
 * TEMPORARY token preview. Exists so the light-pastel foundation can be
 * reviewed in isolation before any real page is restyled, and is deleted in
 * the landing step. Nothing links to it.
 */
export const metadata = { title: "Design preview · XuPay" };

const SWATCHES = [
  { name: "--background", hex: "#fafbff", note: "page ground" },
  { name: "--foreground", hex: "#0f1120", note: "headings · 18.1:1" },
  { name: "--body-foreground", hex: "#3a3d4d", note: "body · 10.4:1" },
  { name: "--muted-foreground", hex: "#545869", note: "labels · 6.8:1" },
  { name: "--primary", hex: "#5b46e5", note: "fill · 6.08:1 vs white" },
  { name: "--primary-accent", hex: "#4f3fd0", note: "accent text · 6.88:1" },
];

export default function DesignPreviewPage() {
  return (
    <main className="mesh-bg relative min-h-svh overflow-hidden">
      <div aria-hidden className="dot-field pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-[1100px] px-6 py-20">
        {/* ---- 1. Gradient heading ---------------------------------------- */}
        <span className="pill-badge">
          <span className="size-1.5 rounded-full bg-[var(--grad-text-to)]" />
          Light pastel foundation
        </span>

        <h1 className="display-hero mt-8 text-[clamp(2.75rem,7vw,5.5rem)]">
          <span className="block text-foreground">ONE LEDGER,</span>
          <span className="accent-gradient-text block">EVERY CENT</span>
        </h1>

        <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-body-foreground">
          Body copy sits at 10.4:1 on the mesh. The heading gradient uses the text
          range, where every stop clears 3:1 for display type.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <button className="accent-gradient-fill inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium shadow-[var(--shadow-float)]">
            Open an account <ArrowUpRight weight="light" className="size-4" />
          </button>
          <button className="inline-flex items-center rounded-full border border-hairline-strong bg-surface px-7 py-3.5 text-sm font-medium text-foreground shadow-[var(--shadow-soft)]">
            See live rates
          </button>
        </div>

        {/* ---- 2. Glass vs data surface ----------------------------------- */}
        <h2 className="mt-20 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Glass card vs data panel
        </h2>
        <p className="mt-2 max-w-[60ch] text-sm text-body-foreground">
          Left is <code className="font-mono text-primary-accent">.glass-card</code>, for the
          landing. Right is <code className="font-mono text-primary-accent">.panel</code>,
          opaque, for tables and dense app screens. The difference is the point:
          money never sits on frosted glass.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="glass-card p-7">
            <p className="field-label">Wallet balance</p>
            <p className="figure-lg mt-3 text-[2.25rem] leading-none text-foreground">
              {formatCurrencyFromCents(1_184_792_000)}
            </p>
            <div className="mt-6 space-y-3">
              {[
                ["Deposit · Salary", 250_000_000],
                ["Transfer · An Nguyen", -15_000_000],
              ].map(([label, cents]) => (
                <div key={label as string} className="flex items-center justify-between text-sm">
                  <span className="text-body-foreground">{label}</span>
                  <span className="font-mono tabular-nums text-foreground">
                    {formatCurrencyFromCents(cents as number)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-7">
            <p className="field-label">Recent transactions</p>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b border-hairline">
                  <th className="field-label pb-2 text-left">Type</th>
                  <th className="field-label pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Withdrawal · ATM", -50_000_000],
                  ["Deposit · Refund", 32_000_000],
                  ["Transfer · Minh Le", -7_500_000],
                ].map(([label, cents]) => (
                  <tr key={label as string} className="border-b border-hairline last:border-0">
                    <td className="py-3 text-body-foreground">{label}</td>
                    <td className="py-3 text-right font-mono tabular-nums text-foreground">
                      {formatCurrencyFromCents(cents as number)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ---- 3. Floating mini-cards ------------------------------------- */}
        <h2 className="mt-20 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Floating mini-cards
        </h2>
        <div className="mt-6 flex flex-wrap gap-6">
          <div className="float-card -rotate-3 px-5 py-4">
            <p className="font-mono text-sm text-foreground">1 USD = 26,145 VND</p>
            <p className="field-label mt-1">USD to VND</p>
          </div>
          <div className="float-card float-card--delayed rotate-2 px-5 py-4">
            <p className="font-mono text-sm text-foreground">
              {formatCurrencyFromCents(250_000_000)}
            </p>
            <p className="field-label mt-1">Salary deposit</p>
          </div>
          <div className="float-card float-card--slow -rotate-1 flex items-center gap-2 px-5 py-4">
            <span className="flex size-5 items-center justify-center rounded-full bg-success/12">
              <Check weight="light" className="size-3 text-success" />
            </span>
            <p className="text-sm font-medium text-foreground">Settled in 1.4s</p>
          </div>
        </div>

        {/* ---- 4. Swatches ------------------------------------------------ */}
        <h2 className="mt-20 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Token contrast
        </h2>
        <div className="panel mt-6 grid gap-px overflow-hidden sm:grid-cols-2 lg:grid-cols-3">
          {SWATCHES.map((s) => (
            <div key={s.name} className="flex items-center gap-3 bg-surface p-4">
              <span
                className="size-9 shrink-0 rounded-lg border border-hairline"
                style={{ background: s.hex }}
              />
              <div className="min-w-0">
                <p className="truncate font-mono text-xs text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.note}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="panel p-4">
            <p className="field-label">Decoration range</p>
            <div className="mt-2 h-8 rounded-lg bg-[linear-gradient(100deg,var(--grad-deco-from),var(--grad-deco-mid),var(--grad-deco-to))]" />
            <p className="mt-2 text-xs text-muted-foreground">Never carries text</p>
          </div>
          <div className="panel p-4">
            <p className="field-label">Text range</p>
            <div className="mt-2 h-8 rounded-lg bg-[linear-gradient(100deg,var(--grad-text-from),var(--grad-text-mid),var(--grad-text-to))]" />
            <p className="mt-2 text-xs text-muted-foreground">Display type only · ≥3:1</p>
          </div>
          <div className="panel p-4">
            <p className="field-label">Fill range</p>
            <div className="mt-2 h-8 rounded-lg bg-[linear-gradient(100deg,var(--grad-fill-from),var(--grad-fill-to))]" />
            <p className="mt-2 text-xs text-muted-foreground">Behind white text · ≥5.45:1</p>
          </div>
        </div>
      </div>
    </main>
  );
}
