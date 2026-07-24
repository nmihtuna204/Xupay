import Link from "next/link";
import { Reveal } from "@/components/common/Reveal";

/**
 * Cinematic landing page — five full-viewport sections with vertical
 * scroll-snap, each carrying a single message. Typography is the hero;
 * negative space and restraint do the rest. The one gradient allowed on the
 * whole app lives in the hero glow below.
 */
export default function LandingPage() {
  return (
    <main className="h-svh snap-y snap-proximity overflow-y-scroll scroll-smooth">
      <HeroSection />
      <LedgerSection />
      <FraudSection />
      <ComplianceSection />
      <ClosingSection />
    </main>
  );
}

/* ---------------------------------------------------------------- 01 · Hero */

function HeroSection() {
  return (
    <section className="section-full relative snap-start items-center overflow-hidden">
      {/* The single gradient on the whole app + film-grain noise. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(120%_80%_at_50%_-10%,color-mix(in_oklab,var(--accent-from)_22%,transparent),transparent_60%)]"
      />
      <div aria-hidden className="noise-overlay pointer-events-none absolute inset-0 -z-10 opacity-[0.15]" />

      <div className="mx-auto w-full max-w-[1200px] px-6 text-center">
        <Reveal as="p" className="kicker">
          Ledger-accurate payments
        </Reveal>
        <Reveal as="h1" delay={80} className="display-hero mt-6 text-balance">
          Payments, perfected.
        </Reveal>
        <Reveal
          as="p"
          delay={160}
          className="mx-auto mt-8 max-w-xl text-balance text-lg text-muted-foreground"
        >
          A digital wallet engineered like infrastructure — instant transfers, real-time fraud
          scoring, and compliance, accurate to the cent.
        </Reveal>
      </div>

      {/* CTAs anchored to the bottom of the viewport, not the center. */}
      <div className="absolute inset-x-0 bottom-14 flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <Link
            href="/register"
            className="rounded-full bg-foreground px-6 py-3 text-sm font-medium uppercase tracking-[0.08em] text-background transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium uppercase tracking-[0.08em] text-foreground transition-colors hover:bg-white/5"
          >
            Sign in
          </Link>
        </div>
        <span className="text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
          Scroll to explore
        </span>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- 02 · Ledger-accurate */

function LedgerSection() {
  return (
    <section className="section-full snap-start">
      <div className="mx-auto grid w-full max-w-[1200px] items-center gap-16 px-6 lg:grid-cols-2">
        <div>
          <Reveal as="p" className="kicker">
            Double-entry core
          </Reveal>
          <Reveal as="h2" delay={80} className="display mt-5 text-4xl text-balance sm:text-6xl">
            Balanced to the cent.
          </Reveal>
          <Reveal
            as="p"
            delay={160}
            className="mt-6 max-w-md text-balance text-lg leading-relaxed text-muted-foreground"
          >
            Every movement is a double-entry, idempotent transaction. Deposits, withdrawals and
            transfers reconcile exactly — no drift, no duplicates, no surprises.
          </Reveal>
        </div>

        <Reveal delay={120}>
          <LedgerVisual />
        </Reveal>
      </div>
    </section>
  );
}

function LedgerVisual() {
  const rows = [
    { label: "Deposit · salary", amount: "+2,500,000", tone: "text-success" },
    { label: "Transfer · An Nguyen", amount: "−150,000", tone: "text-foreground" },
    { label: "Withdrawal · ATM", amount: "−500,000", tone: "text-foreground" },
  ];
  return (
    <div className="glass-card p-8">
      <p className="kicker">Wallet balance</p>
      <p className="figure-lg mt-3 text-5xl">₫11,999,955</p>
      <div className="mt-8 flex flex-col divide-y divide-white/[0.06]">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between py-3.5 text-sm">
            <span className="text-muted-foreground">{row.label}</span>
            <span className={`font-mono tabular-nums ${row.tone}`}>{row.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- 03 · Fraud detection */

function FraudSection() {
  return (
    <section className="section-full relative snap-start items-center overflow-hidden">
      <FaintAreaChart />
      <div className="relative mx-auto w-full max-w-[1200px] px-6 text-center">
        <Reveal as="p" className="kicker">
          Fraud detection
        </Reveal>
        <Reveal as="h2" delay={80} className="display mx-auto mt-5 max-w-3xl text-4xl text-balance sm:text-6xl">
          Risk, scored in real time.
        </Reveal>
        <Reveal
          as="p"
          delay={160}
          className="mx-auto mt-6 max-w-xl text-balance text-lg leading-relaxed text-muted-foreground"
        >
          Every transaction is scored the instant it happens and allowed, held for review, or
          blocked — before the money moves.
        </Reveal>
        <Reveal as="div" delay={220} className="mt-14 flex items-end justify-center gap-14">
          <Stat value="18.4K" label="Evaluated / day" />
          <Stat value="< 40ms" label="Scoring latency" />
          <Stat value="3.7%" label="False-positive rate" />
        </Reveal>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="figure-lg text-3xl sm:text-4xl">{value}</p>
      <p className="mt-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
    </div>
  );
}

/** Faint decorative area chart behind the fraud copy (inline SVG, no JS). */
function FaintAreaChart() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-2/3 w-full opacity-[0.14]"
      viewBox="0 0 1200 400"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="fraudFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3987e5" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#3987e5" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,320 C120,300 180,180 300,200 C420,220 480,120 600,150 C720,180 780,90 900,130 C1020,170 1080,240 1200,210 L1200,400 L0,400 Z"
        fill="url(#fraudFill)"
      />
      <path
        d="M0,320 C120,300 180,180 300,200 C420,220 480,120 600,150 C720,180 780,90 900,130 C1020,170 1080,240 1200,210"
        fill="none"
        stroke="#3987e5"
        strokeWidth="2"
        strokeOpacity="0.5"
      />
    </svg>
  );
}

/* --------------------------------------------------------- 04 · Compliance & KYC */

const STEPS = [
  { n: "01", title: "Upload documents", body: "Passport, ID or proof of address — reviewed and verified." },
  { n: "02", title: "Tiered limits", body: "Verification unlocks higher transaction and volume limits." },
  { n: "03", title: "SAR reporting", body: "Suspicious activity is flagged, filed and auditable end to end." },
];

function ComplianceSection() {
  return (
    <section className="section-full snap-start">
      <div className="mx-auto w-full max-w-[1200px] px-6">
        <Reveal as="p" className="kicker">
          Compliance &amp; KYC
        </Reveal>
        <Reveal as="h2" delay={80} className="display mt-5 max-w-2xl text-4xl text-balance sm:text-6xl">
          Verified by design.
        </Reveal>

        <div className="mt-20 grid gap-12 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.n} delay={120 + i * 100} className="border-t border-white/[0.08] pt-6">
              <p className="figure-lg text-5xl text-muted-foreground/50">{step.n}</p>
              <h3 className="mt-6 text-xl font-medium">{step.title}</h3>
              <p className="mt-3 max-w-xs text-muted-foreground">{step.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- 05 · Closing CTA */

function ClosingSection() {
  return (
    <section className="section-full relative snap-start items-center">
      <div className="mx-auto w-full max-w-[1200px] px-6 text-center">
        <Reveal as="h2" className="display text-balance text-5xl sm:text-7xl">
          Move money the right way.
        </Reveal>
        <Reveal as="div" delay={120} className="mt-12">
          <Link
            href="/register"
            className="inline-block rounded-full bg-foreground px-8 py-4 text-sm font-medium uppercase tracking-[0.08em] text-background transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
        </Reveal>
      </div>

      <footer className="absolute inset-x-0 bottom-8 text-center text-xs text-muted-foreground">
        XuPay — a ledger-accurate fintech platform · Next.js 16 · Spring Boot
      </footer>
    </section>
  );
}
