import { cn } from "@/lib/utils";

/**
 * A glass mini-card drifting off-grid. The signature device of the Agio
 * reference and the layer the landing was missing.
 *
 * Tilt and drift are props rather than baked-in classes so each instance can
 * take its own angle and phase. That matters: four cards sharing one duration
 * and delay rise and fall in lockstep, which reads as a carousel rather than
 * as depth. Offsetting the phase is what makes the group feel like separate
 * objects at separate distances.
 *
 * Everything here is decoration. The component is aria-hidden and
 * pointer-events-none at the wrapper, so a screen reader hears the headline
 * and the CTA instead of a handful of numbers with no context, and the cards
 * never intercept a click aimed at the page beneath.
 */
export function FloatCard({
  children,
  className,
  /** Degrees of tilt. Kept inside +/-4: past that it reads as broken, not placed. */
  rotate = 0,
  /** Seconds for one drift cycle. Longer reads heavier and further away. */
  duration = 9,
  /** Negative seconds, to start mid-cycle so cards are not synchronised. */
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  rotate?: number;
  duration?: number;
  delay?: number;
}) {
  return (
    <div
      className={cn("float-card absolute px-4 py-3", className)}
      style={{
        // Rotation is applied here and the drift keyframe composes on top via
        // the CSS variable, so the two transforms cannot clobber each other.
        "--float-rotate": `${rotate}deg`,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/** Small uppercase caption under a float-card figure. */
export function FloatCardLabel({ children }: { children: React.ReactNode }) {
  return <p className="field-label mt-0.5 whitespace-nowrap">{children}</p>;
}

/** Mono figure line, tabular so drifting digits do not jitter in width. */
export function FloatCardFigure({ children }: { children: React.ReactNode }) {
  return (
    <p className="whitespace-nowrap font-mono text-sm tabular-nums text-foreground">
      {children}
    </p>
  );
}
