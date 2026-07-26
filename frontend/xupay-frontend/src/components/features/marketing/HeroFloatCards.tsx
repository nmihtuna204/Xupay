import { ArrowDownLeft, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { formatCurrencyFromCents } from "@/lib/format";
import { FloatCard, FloatCardFigure, FloatCardLabel } from "./FloatCard";

/**
 * The cards orbiting the hero.
 *
 * Positions are deliberately uneven and phases are deliberately unequal: four
 * cards at matching offsets and one shared animation read as a diagram, not as
 * depth. Each sits in the outer gutter, clear of the centred headline column,
 * because the one thing this layer must not do is cross the type.
 *
 * Density steps with the viewport rather than switching off. Two cards from
 * md, four from lg. Below md there is no gutter left to place them in without
 * crossing the headline, so they stay out entirely - a cluttered hero costs
 * more than a missing flourish.
 */
export function HeroFloatCards() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
      {/* Upper left, an incoming credit. Shown from md. */}
      <FloatCard
        rotate={-3}
        duration={9}
        delay={0}
        className="left-[2%] top-[20%] xl:left-[6%]"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success/12">
            <ArrowDownLeft weight="light" className="size-4 text-success" />
          </span>
          <div>
            <FloatCardFigure>{formatCurrencyFromCents(250_000_000)}</FloatCardFigure>
            <FloatCardLabel>Salary deposit</FloatCardLabel>
          </div>
        </div>
      </FloatCard>

      {/* Lower right, settlement. Shown from md so the pair is diagonal. */}
      <FloatCard
        rotate={-2}
        duration={11}
        delay={-4}
        className="right-[3%] top-[66%] xl:right-[9%]"
      >
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2 shrink-0">
            <span className="absolute inline-flex size-full rounded-full bg-success/60" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          <p className="whitespace-nowrap text-sm font-medium text-foreground">
            Settles instantly
          </p>
        </div>
      </FloatCard>

      {/* The remaining pair only appears once there is real gutter for it. */}
      <div className="hidden lg:block">
        {/* Lower left, the conversion card the reference leads with. */}
        <FloatCard
          rotate={2}
          duration={10}
          delay={-6}
          className="left-[5%] top-[62%] xl:left-[10%]"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--grad-text-from)_14%,transparent)]">
              <span className="font-mono text-xs font-medium text-primary-accent">₫</span>
            </span>
            <div>
              <FloatCardFigure>1 USD = 26,145</FloatCardFigure>
              <FloatCardLabel>USD to VND</FloatCardLabel>
            </div>
          </div>
        </FloatCard>

        {/* Upper right, risk scoring. */}
        <FloatCard
          rotate={3}
          duration={12}
          delay={-2}
          className="right-[3%] top-[28%] xl:right-[7%]"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck weight="light" className="size-4 text-primary-accent" />
            </span>
            <div>
              <FloatCardFigure>Fraud score: low</FloatCardFigure>
              <FloatCardLabel>Scored before send</FloatCardLabel>
            </div>
          </div>
        </FloatCard>
      </div>
    </div>
  );
}
