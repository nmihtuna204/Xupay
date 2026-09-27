import Link from "next/link";
import { Reveal } from "@/components/common/Reveal";
import { HeroRings } from "@/components/features/marketing/hero-rings/HeroRings";
import { TierLimits } from "@/components/features/marketing/TierLimits";
import { TransferQuoteCard } from "@/components/features/marketing/TransferQuoteCard";
import { LedgerPanel } from "@/components/features/marketing/LedgerPanel";
import { RiskSignal } from "@/components/features/marketing/RiskSignal";
import { formatCurrencyFromCents } from "@/lib/format";

/**
 * Dark glass landing (docs/design/spec.md): a near-black ground with a masked
 * grid, two glass rings behind the hero, and the tier card overlapping the
 * hero's lower ring the way the reference's pricing card does. Copy, brand
 * and routes are unchanged from the previous design; only the visual layer
 * was replaced.
 */
export default function LandingPage() {
  return (
    <main>
      <HeroStage />
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
    <Link href="/register" className="cta-primary">
      {label}
    </Link>
  );
}

function SectionHeading({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Reveal
      as="h2"
      className={`display text-[clamp(2.25rem,4.5vw,3.5rem)] text-foreground ${className ?? ""}`}
    >
      {children}
    </Reveal>
  );
}

/** A small static glass chip: a status dot and a short line. */
function Chip({ tone, children }: { tone: "success" | "warning" | "error"; children: React.ReactNode }) {
  const dot = { success: "bg-success", warning: "bg-warning", error: "bg-error" }[tone];
  return (
    <span className="hero-badge text-[0.8125rem]">
      <span className={`size-1.5 rounded-full ${dot}`} />
      {children}
    </span>
  );
}

/* ------------------------------------------------ 01 · Hero + tier stage card */

/*
 * One stage for the hero and the card that overlaps it, because the rings
 * run behind both. Layer order (spec §4): charcoal aperture -> grid -> rings
 * (-z-[5]) -> copy. `isolate` makes this the stacking context those negative
 * z-indices resolve in; without it they would sit under the page ground.
 */
function HeroStage() {
  return (
    <div className="relative isolate overflow-hidden">
      <div aria-hidden className="aperture-glow absolute inset-x-0 top-0 -z-20 h-[calc(100svh+22rem)]" />
      <div aria-hidden className="grid-ground absolute inset-x-0 top-0 -z-10 h-[calc(100svh+22rem)]" />
      <HeroRings />

      <section className="relative flex flex-col items-center px-6 pt-[clamp(8rem,21svh,12rem)] text-center">
        <Reveal>
          <span className="hero-badge">
            <span className="size-1.5 rounded-full bg-success" />
            Ledger-accurate payments
          </span>
        </Reveal>

        <Reveal
          as="h1"
          delay={80}
          className="display-hero mt-7 text-[clamp(3rem,7vw,5.5rem)] text-foreground"
        >
          <span className="block">Every cent,</span>
          <span className="block">accounted for</span>
        </Reveal>

        <div className="relative mt-6">
          {/*
            The lower ring's top arc crosses this line of copy, as it does in
            the reference. A soft scrim between the rings (-z-[5]) and the
            text dims the arc under the words so it reads as depth, not as a
            strike-through.
          */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-10 -inset-y-6 -z-[4] bg-[radial-gradient(closest-side,rgb(3_3_5/78%),transparent)]"
          />
          <Reveal
            as="p"
            delay={160}
            className="max-w-[600px] text-[0.9375rem] leading-relaxed text-body-foreground [text-shadow:0_1px_12px_rgb(3_3_5/90%)]"
          >
            A digital wallet engineered like infrastructure. Instant transfers, real-time
            fraud scoring, and compliance, accurate to the cent.
          </Reveal>
        </div>

        <Reveal
          as="div"
          delay={240}
          className="mt-9 flex flex-col items-center gap-6 sm:flex-row sm:gap-7"
        >
          <PrimaryCta />
          <TransferProof />
        </Reveal>
      </section>

      <section className="relative px-4 pb-[var(--spacing-section)] pt-14 sm:px-6">
        <Reveal delay={120}>
          <TierLimits />
        </Reveal>
      </section>
    </div>
  );
}

/*
 * The reference's social-proof slot. XuPay has no user count and no customer
 * photos, so it claims neither: the avatars are the app's own initial chips,
 * and the two facts are ones the landing already states (a 0 ₫ transfer fee,
 * instant settlement).
 */
const PROOF_AVATARS = [
  { initials: "AN", tint: "from-[#4358d1] to-[#8b7cf8]" },
  { initials: "LT", tint: "from-[#ff6a3d] to-[#b83280]" },
  { initials: "DP", tint: "from-[#199e70] to-[#3987e5]" },
];

function TransferProof() {
  return (
    <div className="relative flex items-center gap-3.5">
      {/* Same scrim as the subtitle: the lower ring's arc runs through here. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-8 -inset-y-5 -z-[4] bg-[radial-gradient(closest-side,rgb(3_3_5/78%),transparent)]"
      />
      <div aria-hidden className="flex -space-x-3">
        {PROOF_AVATARS.map((a) => (
          <span
            key={a.initials}
            className={`flex size-11 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white ring-2 ring-background ${a.tint}`}
          >
            {a.initials}
          </span>
        ))}
      </div>
      <p className="text-left text-sm leading-snug text-body-foreground [text-shadow:0_1px_12px_rgb(3_3_5/90%)]">
        Transfers between wallets
        <br />
        <span className="font-semibold text-foreground">{formatCurrencyFromCents(0)}</span> fee ·
        settles instantly
      </p>
    </div>
  );
}

/* ------------------------------------------------------- 02 · Ledger-accurate */

function LedgerSection() {
  return (
    <section className="relative isolate overflow-hidden px-6 py-[var(--spacing-section)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgb(255_255_255/10%),transparent)]"
      />
      <div className="relative mx-auto grid w-full max-w-[1200px] items-center gap-14 lg:grid-cols-[45fr_55fr]">
        <div className="lg:order-2">
          <SectionHeading>Balanced to the cent.</SectionHeading>
          <Reveal
            as="p"
            delay={120}
            className="mt-6 max-w-[52ch] text-[0.9375rem] leading-relaxed text-body-foreground sm:text-base"
          >
            Every movement is a double-entry, idempotent transaction. Deposits, transfers
            and withdrawals reconcile exactly. No drift, no duplicates.
          </Reveal>
          <Reveal delay={200} className="mt-10">
            <TransferQuoteCard />
          </Reveal>
        </div>
        <Reveal delay={120} className="relative lg:order-1">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-10 -z-10 bg-[radial-gradient(closest-side,rgb(91_91_240/22%),transparent)] blur-2xl"
          />
          <div className="glass-card overflow-hidden">
            <LedgerPanel />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- 03 · Fraud detection */

function FraudSection() {
  return (
    <section className="relative isolate overflow-hidden px-6 py-[var(--spacing-section)]">
      <div className="relative mx-auto w-full max-w-[1200px] text-center">
        <SectionHeading className="mx-auto max-w-3xl">Risk, scored in real time.</SectionHeading>
        <Reveal
          as="p"
          delay={120}
          className="mx-auto mt-6 max-w-[54ch] text-[0.9375rem] leading-relaxed text-body-foreground sm:text-base"
        >
          Every transaction is scored the instant it happens, then allowed, held for
          review, or blocked before the money moves.
        </Reveal>

        <div className="relative mt-16">
          {/* Behind the tiles from sm up. On a phone the tiles stack and the
              spike would stab through their labels, so it runs underneath. */}
          <RiskSignal className="absolute inset-x-0 top-1/2 -z-10 hidden h-[240px] -translate-y-1/2 sm:block" />
          {/*
            Illustrative figures, not measured production numbers, and
            labelled as such below: unlabelled specifics on a marketing page
            read as real claims.
          */}
          <Reveal as="div" delay={200} className="flex flex-wrap items-stretch justify-center gap-5">
            <div className="glass-card px-9 py-7">
              <p className="figure-lg text-[clamp(2.25rem,5vw,3.5rem)] leading-none text-primary-accent">
                &lt;40ms
              </p>
              <p className="mt-3 text-sm text-muted-foreground">Target scoring latency</p>
            </div>
            <div className="glass-card px-9 py-7">
              <p className="figure-lg text-[clamp(2.25rem,5vw,3.5rem)] leading-none text-foreground">
                18.4K
              </p>
              <p className="mt-3 text-sm text-muted-foreground">Sample daily volume</p>
            </div>
          </Reveal>
          <RiskSignal className="mt-6 h-[110px] sm:hidden" />
        </div>

        <Reveal as="div" delay={240} className="mt-10 flex flex-wrap justify-center gap-3">
          <Chip tone="warning">3 held for review</Chip>
          <Chip tone="error">1 blocked</Chip>
        </Reveal>
        <Reveal as="p" delay={260} className="mt-8 text-xs text-muted-foreground">
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
    <section className="relative isolate overflow-hidden px-6 py-[var(--spacing-section)]">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[520px] w-[900px] -translate-x-1/2 bg-[radial-gradient(closest-side,rgb(91_91_240/14%),transparent)]"
      />
      <div className="relative mx-auto w-full max-w-[1200px]">
        <SectionHeading className="max-w-2xl">Verified by design.</SectionHeading>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.n} delay={120 + i * 110}>
              <div className="glass-card relative h-full overflow-hidden p-7">
                <span className="font-mono text-xs text-primary-accent">{step.n}</span>
                <h3 className="mt-8 text-lg font-medium tracking-[-0.01em] text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-body-foreground">
                  {step.body}
                </p>
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
    <section className="relative isolate overflow-hidden px-6 pt-[var(--spacing-section)]">
      <div aria-hidden className="grid-ground absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_45%,#000_20%,transparent_75%)]" />
      {/* The hero's rings, rising again behind the final call to action. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative still, sized in CSS */}
      <img
        src="/ring-fallback.png"
        alt=""
        aria-hidden
        loading="lazy"
        className="pointer-events-none absolute left-1/2 top-[58%] -z-10 w-[min(900px,130vw)] max-w-none -translate-x-1/2 opacity-60 [mask-image:linear-gradient(to_bottom,#000_30%,transparent_75%)]"
      />

      <div className="relative mx-auto w-full max-w-[1200px] text-center">
        <Reveal as="h2" className="display-hero text-[clamp(2.75rem,6.5vw,5rem)] text-foreground">
          <span className="block">Move money</span>
          <span className="block">the right way</span>
        </Reveal>
        <Reveal as="div" delay={120} className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <PrimaryCta label="Open an account" />
        </Reveal>
        <Reveal as="div" delay={200} className="mt-10 flex flex-wrap justify-center gap-3">
          <span className="hero-badge text-[0.8125rem]">
            <span className="font-mono text-foreground">{formatCurrencyFromCents(1_184_792_000)}</span>
            <span className="text-muted-foreground">Reconciled to the cent</span>
          </span>
          <Chip tone="success">No drift, no duplicates</Chip>
        </Reveal>
      </div>

      <footer className="relative mt-[clamp(8rem,18vw,14rem)] border-t border-hairline py-8 text-center text-xs text-muted-foreground">
        XuPay. Ledger-accurate fintech on Next.js 16 and Spring Boot.
      </footer>
    </section>
  );
}
