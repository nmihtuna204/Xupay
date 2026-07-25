/**
 * Categorical series colors, validated with scripts/validate_palette.js:
 * worst adjacent CVD ΔE 9.4, normal-vision ΔE 26.5. Assigned in fixed order,
 * never cycled.
 *
 * RE-CHECKED ON THE LIGHT SURFACE and deliberately left unchanged. Charts
 * render inside .panel, which is opaque white, and every series clears the
 * WCAG 1.4.11 3:1 bar for non-text graphics there:
 *
 *   blue   #3987e5  3.64:1      orange #d95926  3.88:1
 *   aqua   #199e70  3.41:1      yellow #c98500  3.07:1
 *
 * Yellow is the tight one at 3.07:1, which is the reason charts must stay on
 * .panel and never sit directly on the meshed app ground: on that background
 * it measures 2.65:1 and aqua 2.94:1, both failing. Panel-only is a hard
 * constraint of this palette, not a stylistic preference.
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
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
} as const;

/**
 * Chart chrome for the light surface: hairline grid, muted axes.
 *
 * These are literal values rather than var(--token) because Recharts writes
 * them as SVG presentation attributes, and browsers do not resolve var() in
 * an attribute the way they do in a CSS declaration - stroke="var(--x)" is
 * simply dropped. They therefore track the light theme's --grid-line and
 * --muted-foreground by hand; if those tokens change, change these too.
 *
 * The axis value is --muted-foreground rather than something lighter because
 * tick labels are 11px TEXT, so they owe 4.5:1, not the 3:1 a gridline owes.
 * At #4a4e5e they measure 8.0:1 on panel white.
 */
export const CHART_INK = {
  grid: "rgba(15,17,32,0.07)",
  axis: "#4a4e5e",
};
