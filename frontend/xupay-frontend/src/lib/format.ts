/**
 * The backend always expresses money as integer minor units ("amountCents")
 * where 1 unit of display currency = 100 cents, regardless of the
 * currency's real-world minor unit (see amountCents:10000 -> amount:100.00
 * in the payment-service API docs). We always divide by 100 for display.
 *
 * Money is written the way its own market writes it, not the way the UI
 * language would: VND reads "11.847.920 ₫" (dot grouping, sign after), never
 * "₫11,847,920.00". Every other currency keeps the en-US shape.
 */
const CURRENCY_LOCALE: Record<string, string> = { VND: "vi-VN" };

export function moneyLocale(currency = "VND"): string {
  return CURRENCY_LOCALE[currency] ?? "en-US";
}

/** The currency's real minor unit: 0 for VND, 2 for USD. */
function minorDigits(currency: string): number {
  try {
    return (
      new Intl.NumberFormat("en-US", { style: "currency", currency }).resolvedOptions()
        .maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

/**
 * The one money-display shape. Exported so components that cannot call
 * formatCurrencyFromCents directly (animated figures such as NumberFlow, which
 * need Intl options rather than a finished string) still render money
 * identically to the rest of the app instead of drifting. Pair it with
 * moneyLocale(currency).
 *
 * Fraction digits: a currency with no minor unit (VND) prints none, so a
 * balance is not padded with a meaningless ",00". The maximum stays at 2
 * because amountCents CAN carry a fraction even for VND, and hiding it would
 * silently round the value; it only appears when it is actually there.
 */
export function moneyFormatOptions(currency = "VND") {
  // `satisfies` rather than a return annotation: NumberFlow's Format type omits
  // and re-narrows `notation`, so a widened Intl.NumberFormatOptions would not
  // be assignable to it. This keeps the inferred shape narrow for both callers.
  return {
    style: "currency",
    currency,
    minimumFractionDigits: minorDigits(currency),
    maximumFractionDigits: 2,
  } satisfies Intl.NumberFormatOptions;
}

export function formatCurrencyFromCents(amountCents: number, currency = "VND"): string {
  const amount = amountCents / 100;
  try {
    return new Intl.NumberFormat(moneyLocale(currency), moneyFormatOptions(currency)).format(amount);
  } catch {
    // Unknown/invalid currency code — fall back to a plain number so the UI
    // never crashes on unexpected backend data.
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/**
 * Compact money for chart axes/tooltips, in the same locale as full amounts so
 * the separators never disagree on one screen: 1_250_000_000 cents VND ->
 * "12,5 Tr ₫" (Tr = triệu, N = nghìn, T = tỷ).
 */
export function formatCompactCurrencyFromCents(amountCents: number, currency = "VND"): string {
  const amount = amountCents / 100;
  try {
    return new Intl.NumberFormat(moneyLocale(currency), {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    return `${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(amount)} ${currency}`;
  }
}

/** Compact plain number, e.g. 18432 -> "18.4K". */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

/** Percentage from a 0–1 fraction, e.g. 0.037 -> "3.7%". */
export function formatPercent(fraction: number, digits = 1): string {
  return `${(fraction * 100).toFixed(digits)}%`;
}

export function formatDate(iso?: string): string {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDateShort(iso?: string): string {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

/** Up-to-two-letter initials from a full name, e.g. "An Nguyen" -> "AN". */
export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
