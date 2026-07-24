/**
 * Categorical series colors for the dark chart surface (~#131826).
 * These are the dataviz reference palette's dark-mode steps, validated with
 * scripts/validate_palette.js (all checks pass on this surface: worst
 * adjacent CVD ΔE 9.4, normal-vision ΔE 26.5, all ≥ 3:1 contrast). Assigned
 * in fixed order — never cycled.
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

// Chart chrome for the dark surface.
export const CHART_INK = {
  grid: "#2c2c2a",
  axis: "#898781",
  tooltipBg: "#0d1220",
  tooltipBorder: "rgba(255,255,255,0.12)",
};
