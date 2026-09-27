/**
 * Categorical series colors, validated with scripts/validate_palette.js:
 * worst adjacent CVD ΔE 9.4, normal-vision ΔE 26.5. Assigned in fixed order,
 * never cycled.
 *
 * Measured on the dark .panel surface (#0a0a0f), every series clears the
 * WCAG 1.4.11 3:1 bar for non-text graphics with room to spare:
 *
 *   blue   #3987e5  5.43:1      orange #d95926  5.09:1
 *   aqua   #199e70  5.80:1      yellow #c98500  6.43:1
 *
 * Charts still live on .panel rather than on the app ground, so the figures
 * above are the ones that apply.
 */
export const SERIES_COLORS = {
  blue: "#3987e5",
  orange: "#d95926",
  aqua: "#199e70",
  yellow: "#c98500",
} as const;

export const CATEGORICAL = [
  SERIES_COLORS.blue,
  SERIES_COLORS.orange,
  SERIES_COLORS.aqua,
  SERIES_COLORS.yellow,
];

/**
 * Status palette (fixed, never themed) for risk/state — always paired with a
 * text label so hue never carries meaning alone.
 */
export const STATUS_COLORS = {
  good: "#30a46c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
} as const;

/**
 * Chart chrome for the dark surface: hairline grid, muted axes.
 *
 * These are literal values rather than var(--token) because Recharts writes
 * them as SVG presentation attributes, and browsers do not resolve var() in
 * an attribute the way they do in a CSS declaration - stroke="var(--x)" is
 * simply dropped. They therefore track --grid-line and --muted-foreground by
 * hand; if those tokens change, change these too.
 *
 * The axis value is --muted-foreground because tick labels are 11px TEXT, so
 * they owe 4.5:1, not the 3:1 a gridline owes. #8b8b94 measures 5.85:1 on
 * the panel surface. `cursor` is the hover band behind a bar.
 */
export const CHART_INK = {
  grid: "rgba(255,255,255,0.06)",
  axis: "#8b8b94",
  cursor: "rgba(255,255,255,0.04)",
};
