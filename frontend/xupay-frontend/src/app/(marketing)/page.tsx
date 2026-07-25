import Link from "next/link";
import { Reveal } from "@/components/common/Reveal";
import { HeroBalanceCard } from "@/components/features/marketing/HeroBalanceCard";
import { LedgerPanel } from "@/components/features/marketing/LedgerPanel";
import { FraudChartBackground } from "@/components/features/marketing/FraudChartBackground";

/**
 * Cinematic landing — five full-viewport, scroll-snapped sections. Each one
 * carries a real visual (a product-UI preview, an animated ledger, a data
 * chart, layered numerals, a geometric field), never text on a flat plane.
 * Typography and negative space frame the visual; they do not replace it.
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
    <section className="section-full bg-mesh relative snap-start overflow-hidden">
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-60" />
      <div aria-hidden className="noise-overlay pointer-events-none absolute inset-0 -z-10 opacity-[0.12]" />

      <div className="mx-auto grid w-full max-w-[1200px] items-center gap-12 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        <div>
          <Reveal as="p" className="kicker">
            Ledger-accurate payments
          </Reveal>
          <Reveal as="h1" delay={80} className="display mt-6 text-[clamp(3rem,7vw,6rem)]">
            Every cent,
            <br />
            accounted for.
          </Reveal>
          <Reveal
            as="p"
            delay={160}
            className="mt-7 max-w-[46ch] text-lg leading-relaxed text-muted-foreground"
          >
            A digital wallet engineered like infrastructure. Instant transfers, real-time fraud
            scoring, and compliance, accurate to the cent.
          </Reveal>
          <Reveal as="div" delay={240} className="mt-10">
            <Link
              href="/register"
              className="inline-flex rounded-full bg-primary px-7 py-3.5 text-sm font-medium tracking-wide text-primary-foreground transition-opacity hover:opacity-90"
            >
              Get started
            </Link>
          </Reveal>
        </div>

        <Reveal delay={200} className="flex justify-center lg:justify-end">
          <HeroBalanceCard />
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- 02 · Ledger-accurate */

function LedgerSection() {
  return (
    <section className="section-full snap-start">
      <div className="mx-auto grid w-full max-w-[1200px] items-center gap-14 px-6 lg:grid-cols-[55fr_45fr]">
        <div>
          <Reveal as="h2" className="display text-4xl sm:text-6xl">
            Balanced to the cent.
          </Reveal>
          <Reveal
            as="p"
            delay={120}
            className="mt-6 max-w-[52ch] text-lg leading-relaxed text-muted-foreground"
          >
            Every movement is a double-entry, idempotent transaction. Deposits, transfers and
            withdrawals reconcile exactly. No drift, no duplicates.
          </Reveal>
        </div>
        <Reveal delay={120}>
          <LedgerPanel />
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- 03 · Fraud detection */

function FraudSection() {
  return (
    <section className="section-full relative snap-start items-center overflow-hidden">
      <FraudChartBackground />
      <div className="relative mx-auto w-full max-w-[1200px] px-6 text-center">
        <Reveal as="h2" className="display mx-auto max-w-3xl text-4xl sm:text-6xl">
          Risk, scored in real time.
        </Reveal>
        <Reveal
          as="p"
          delay={120}
          className="mx-auto mt-6 max-w-[54ch] text-lg leading-relaxed text-muted-foreground"
        >
          Every transaction is scored the instant it happens, then allowed, held for review, or
          blocked before the money moves.
        </Reveal>
        <Reveal as="div" delay={200} className="mt-16 flex items-end justify-center gap-16">
          <div>
            <p className="figure-lg text-[clamp(3rem,7vw,5rem)] leading-none text-primary-accent">
              &lt;40ms
            </p>
            <p className="mt-3 text-sm text-muted-foreground">Median scoring latency</p>
          </div>
          <div className="hidden sm:block">
            <p className="figure-lg text-[clamp(3rem,7vw,5rem)] leading-none">18.4K</p>
            <p className="mt-3 text-sm text-muted-foreground">Evaluated per day</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- 04 · Compliance & KYC */

const STEPS = [
  { n: "01", title: "Upload documents", body: "Passport, ID or proof of address, reviewed and verified." },
  { n: "02", title: "Tiered limits", body: "Verification unlocks higher transaction and volume limits." },
  { n: "03", title: "SAR reporting", body: "Suspicious activity is flagged, filed and auditable end to end." },
];

function ComplianceSection() {
  return (
    <section className="section-full snap-start">
      <div className="mx-auto w-full max-w-[1200px] px-6">
        <Reveal as="h2" className="display max-w-2xl text-4xl sm:text-6xl">
          Verified by design.
        </Reveal>

        <div className="mt-20 grid gap-x-10 gap-y-14 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.n} delay={120 + i * 110} className="relative overflow-hidden">
              {/* Giant faint numeral as the column's background character. */}
              <span
                aria-hidden
                className="figure-lg pointer-events-none absolute -top-8 -left-2 select-none text-[9rem] leading-none text-white/[0.04]"
              >
                {step.n}
              </span>
              <div className="relative border-t border-white/[0.08] pt-6">
                <h3 className="text-xl font-medium">{step.title}</h3>
                <p className="mt-3 max-w-xs leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
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
    <section className="section-full bg-grid relative snap-start items-center overflow-hidden">
      {/* Soft convergent orb for geometric depth. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--accent-from)_16%,transparent),transparent_70%)] blur-3xl"
      />
      <div className="mx-auto w-full max-w-[1200px] px-6 text-center">
        <Reveal as="h2" className="display text-[clamp(2.75rem,7vw,6rem)]">
          Move money the right way.
        </Reveal>
        <Reveal as="div" delay={120} className="mt-12">
          <Link
            href="/register"
            className="inline-flex rounded-full bg-primary px-8 py-4 text-sm font-medium tracking-wide text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
        </Reveal>
      </div>

      <footer className="absolute inset-x-0 bottom-8 text-center text-xs text-muted-foreground">
        XuPay. Ledger-accurate fintech on Next.js 16 and Spring Boot.
      </footer>
    </section>
  );
}
