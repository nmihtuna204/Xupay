import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * A stream of risk scores with one anomaly caught: the Fraud section's
 * backdrop, drawn as SVG so it takes the dark palette and costs no image.
 * The series is generated once at module load from a fixed seed, so the
 * server and client render the identical path.
 */
const W = 1200;
const H = 240;
const N = 120;
const SPIKE = 84; // index of the anomaly, ~70% across

function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const POINTS = (() => {
  const rand = seeded(20260926);
  let level = 0.55;
  return Array.from({ length: N }, (_, i) => {
    level += (rand() - 0.5) * 0.08;
    level = Math.min(0.72, Math.max(0.42, level));
    const spike = i === SPIKE ? -0.46 : i === SPIKE - 1 || i === SPIKE + 1 ? -0.14 : 0;
    return [(i / (N - 1)) * W, (level + spike) * H] as const;
  });
})();

const LINE = POINTS.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
const AREA = `${LINE} L${W} ${H} L0 ${H} Z`;
const [SX, SY] = POINTS[SPIKE];

export function RiskSignal({ className }: { className?: string }) {
  // Per-instance gradient ids: the landing renders this twice (desktop and
  // phone placements), and duplicate SVG ids resolve to whichever came first.
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={cn(
        "pointer-events-none w-full [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]",
        className
      )}
    >
      <defs>
        <linearGradient id={id("stroke")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#4358d1" stopOpacity="0.5" />
          <stop offset="0.6" stopColor="#8b7cf8" stopOpacity="0.9" />
          <stop offset="1" stopColor="#4358d1" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id={id("fill")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#5b5bf0" stopOpacity="0.18" />
          <stop offset="1" stopColor="#5b5bf0" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={id("dot")}>
          <stop offset="0" stopColor="#f2555a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#f2555a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={AREA} fill={`url(#${id("fill")})`} />
      <path d={LINE} fill="none" stroke={`url(#${id("stroke")})`} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <line x1={SX} x2={SX} y1={SY} y2={H} stroke="#f2555a" strokeOpacity="0.35" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />
      <ellipse cx={SX} cy={SY} rx="22" ry="22" fill={`url(#${id("dot")})`} />
      <ellipse cx={SX} cy={SY} rx="3.5" ry="3.5" fill="#f2555a" />
    </svg>
  );
}
