import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/common/Reveal";
import { HeroFloatCards } from "@/components/features/marketing/HeroFloatCards";
import { TransferQuoteCard } from "@/components/features/marketing/TransferQuoteCard";
import { LedgerPanel } from "@/components/features/marketing/LedgerPanel";
import { FraudChartBackground } from "@/components/features/marketing/FraudChartBackground";

/**
 * Light-pastel landing, built to the Agio reference: a saturated mesh ground,
 * a masked dot field, an oversized uppercase headline that runs from solid ink
 * into the brand gradient, glass cards drifting off-grid, and one product card
 * carrying real product figures.
 *
 * Scroll-snapping is gone. The page used a 100svh snap container, which fought
 * the generous section padding this direction needs and could park a reader
 * mid-content on short viewports. Sections are now ordinary blocks with macro
 * whitespace, so the hero fits any viewport and the rhythm comes from the
 * changing pastel ground rather than from forced stops.
 */
export default function LandingPage() {
  return (
    <main>
      <HeroSection />
      <LedgerSection />
      <FraudSection />
      <ComplianceSection />
      <ClosingSection />
    </main>
  );
}

/* --------------------------------------------------------------- Shared bits */

function PrimaryCta({ label = "Open an account" }: { label?: string }) {
  return (
    <Link
      href="/register"
      className="group/cta cta-island accent-gradient-fill shadow-[var(--shadow-float)]"
    >
      {label}
      <span className="cta-island__well bg-white/20">
        <ArrowUpRight weight="light" className="size-4" />
      </span>
    </Link>
  );
}

function SecondaryCta({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-full border border-hairline-strong bg-surface px-6 py-3 text-sm font-medium text-foreground shadow-[var(--shadow-soft)] transition-transform duration-500 ease-[var(--ease-island)] active:scale-[0.98]"
    >
      {label}
    </Link>
  );
}

/* ---------------------------------------------------------------- 01 · Hero */

function HeroSection() {
  return (
    <section className="mesh-bg relative overflow-hidden px-6 pb-28 pt-36 sm:pb-32 lg:pt-40">
      <div aria-hidden className="dot-field pointer-events-none absolute inset-0" />
      <HeroFloatCards />

      <div className="relative mx-auto flex max-w-[1200px] flex-col items-center text-center">
        <Reveal>
          <span className="pill-badge">
            <span className="size-1.5 rounded-full bg-success" />
            Ledger-accurate payments
          </span>
        </Reveal>

        {/*
          Agio's headline device: the first line in solid ink, the second in the
          brand gradient. The gradient uses the TEXT range only, where every
          stop clears 3:1 at display size.
        */}
        <Reveal
          as="h1"
          delay={80}
          className="display-hero mt-8 max-w-[16ch] text-[clamp(2.75rem,7.5vw,6rem)]"
        >
          <span className="block text-foreground">Every cent,</span>
          <span className="accent-gradient-text block">accounted for</span>
        </Reveal>

        <Reveal
          as="p"
          delay={160}
          className="mt-7 max-w-[52ch] text-lg leading-relaxed text-body-foreground"
        >
          A digital wallet engineered like infrastructure. Instant transfers, real-time
          fraud scoring, and compliance, accurate to the cent.
        </Reveal>

        <Reveal as="div" delay={240} className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <PrimaryCta />
          <SecondaryCta href="/login" label="Sign in" />
        </Reveal>

        <Reveal delay={320} className="mt-20 flex w-full justify-center">
          <TransferQuoteCard />
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- 02 · Ledger-accurate */

function LedgerSection() {
  return (
    <section className="mesh-bg--sky relative overflow-hidden px-6 py-28 sm:py-32">
      <div className="mx-auto grid w-full max-w-[1200px] items-center gap-16 lg:grid-cols-[45fr_55fr]">
        {/*
          Mirrored against the hero. DOM order stays copy-then-asset so reading
          and tab order are unchanged on mobile; only the desktop columns swap.
        */}
        <div className="lg:order-2">
          <Reveal as="h2" className="display text-4xl sm:text-5xl">
            Balanced to the cent.
          </Reveal>
          <Reveal
            as="p"
            delay={120}
            className="mt-6 max-w-[52ch] text-lg leading-relaxed text-body-foreground"
          >
            Every movement is a double-entry, idempotent transaction. Deposits, transfers
            and withdrawals reconcile exactly. No drift, no duplicates.
          </Reveal>
        </div>
        <Reveal delay={120} className="lg:order-1">
          <div className="bezel">
            <div className="bezel-core p-2">
              <LedgerPanel />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- 03 · Fraud detection */

function FraudSection() {
  return (
    <section className="relative overflow-hidden bg-background px-6 py-28 sm:py-32">
      <FraudChartBackground />
      <div className="relative mx-auto w-full max-w-[1200px] text-center">
        <Reveal as="h2" className="display mx-auto max-w-3xl text-4xl sm:text-5xl">
          Risk, scored in real time.
        </Reveal>
        <Reveal
          as="p"
          delay={120}
          className="mx-auto mt-6 max-w-[54ch] text-lg leading-relaxed text-body-foreground"
        >
          Every transaction is scored the instant it happens, then allowed, held for
          review, or blocked before the money moves.
        </Reveal>

        {/*
          Illustrative figures, not measured production numbers. Labelled as
          such rather than dropped: unlabelled specifics on a marketing page
          read as real claims, which is a promise the project has not measured.
        */}
        <Reveal as="div" delay={200} className="mt-16 flex flex-wrap items-end justify-center gap-x-16 gap-y-10">
          <div>
            <p className="figure-lg text-[clamp(2.5rem,6vw,4rem)] leading-none text-primary-accent">
              &lt;40ms
            </p>
            <p className="mt-3 text-sm text-muted-foreground">Target scoring latency</p>
          </div>
          <div>
            <p className="figure-lg text-[clamp(2.5rem,6vw,4rem)] leading-none text-foreground">
              18.4K
            </p>
            <p className="mt-3 text-sm text-muted-foreground">Sample daily volume</p>
          </div>
        </Reveal>
        <Reveal as="p" delay={260} className="mt-10 text-xs text-muted-foreground">
          Figures are illustrative of the scoring pipeline, not measured service levels.
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- 04 · Compliance & KYC */

const STEPS = [
  {
    n: "01",
    title: "Upload documents",
    body: "Passport, ID or proof of address, reviewed and verified.",
  },
  {
    n: "02",
    title: "Tiered limits",
    body: "Verification unlocks higher transaction and volume limits.",
  },
  {
    n: "03",
    title: "SAR reporting",
    body: "Suspicious activity is flagged, filed and auditable end to end.",
  },
];

function ComplianceSection() {
  return (
    <section className="mesh-bg--mint relative overflow-hidden px-6 py-28 sm:py-32">
      <div className="mx-auto w-full max-w-[1200px]">
        <Reveal as="h2" className="display max-w-2xl text-4xl sm:text-5xl">
          Verified by design.
        </Reveal>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.n} delay={120 + i * 110}>
              <div className="bezel h-full">
                <div className="bezel-core--glass bezel-core relative h-full overflow-hidden p-7">
                  {/* Oversized numeral as the card's background character. */}
                  <span
                    aria-hidden
                    className="figure-lg pointer-events-none absolute -right-3 -top-6 select-none text-[7rem] leading-none text-[color-mix(in_oklab,var(--grad-text-from)_12%,transparent)]"
                  >
                    {step.n}
                  </span>
                  <div className="relative">
                    <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-3 leading-relaxed text-body-foreground">{step.body}</p>
                  </div>
                </div>
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
    <section className="mesh-bg--rose relative overflow-hidden px-6 pb-16 pt-28 sm:pt-32">
      <div aria-hidden className="bg-rings pointer-events-none absolute inset-0 opacity-70" />
      <div className="relative mx-auto w-full max-w-[1200px] text-center">
        <Reveal as="h2" className="display-hero text-[clamp(2.5rem,6.5vw,5rem)]">
          <span className="block text-foreground">Move money</span>
          <span className="accent-gradient-text block">the right way</span>
        </Reveal>
        <Reveal as="div" delay={120} className="mt-12 flex justify-center">
          <PrimaryCta label="Open an account" />
        </Reveal>
      </div>

      <footer className="relative mt-28 border-t border-hairline pt-8 text-center text-xs text-muted-foreground">
        XuPay. Ledger-accurate fintech on Next.js 16 and Spring Boot.
      </footer>
    </section>
  );
}
