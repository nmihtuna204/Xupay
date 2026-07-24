/**
 * The backend always expresses money as integer minor units ("amountCents")
 * where 1 unit of display currency = 100 cents, regardless of the
 * currency's real-world minor unit (see amountCents:10000 -> amount:100.00
 * in the payment-service API docs). We always divide by 100 for display and
 * force 2 fraction digits, rather than trusting Intl's per-currency default
 * (which would show 0 decimals for VND and silently misrepresent the value).
 */
export function formatCurrencyFromCents(amountCents: number, currency = "VND"): string {
  const amount = amountCents / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Unknown/invalid currency code — fall back to a plain number so the UI
    // never crashes on unexpected backend data.
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/** Compact money for chart axes/tooltips, e.g. 12_500_000_00 cents -> "₫12.5M". */
export function formatCompactCurrencyFromCents(amountCents: number, currency = "VND"): string {
  const amount = amountCents / 100;
  try {
    return new Intl.NumberFormat("en-US", {
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
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDateShort(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

/** Up-to-two-letter initials from a full name, e.g. "An Nguyen" -> "AN". */
export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
