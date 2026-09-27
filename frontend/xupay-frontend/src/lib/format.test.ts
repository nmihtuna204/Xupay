import { describe, expect, it } from "vitest";
import {
  formatCurrencyFromCents,
  formatCompactCurrencyFromCents,
  formatCompactNumber,
  formatPercent,
  formatDate,
  initialsFromName,
} from "./format";

// Intl separates the amount from a trailing sign with a no-break space.
const NBSP = " ";

describe("formatCurrencyFromCents", () => {
  it("writes VND the Vietnamese way: dot grouping, sign after, no ,00", () => {
    expect(formatCurrencyFromCents(1_184_792_000, "VND")).toBe(`11.847.920${NBSP}₫`);
  });

  it("still shows a VND fraction when the cents carry one, rather than rounding it away", () => {
    expect(formatCurrencyFromCents(12345, "VND")).toBe(`123,45${NBSP}₫`);
  });

  it("keeps two decimals for currencies that have a minor unit", () => {
    expect(formatCurrencyFromCents(50000, "USD")).toBe("$500.00");
  });

  it("never crashes on an invalid currency code", () => {
    // A 2-letter code is malformed, so Intl throws and we hit the safe
    // fallback (a well-formed 3-letter code like "ZZZ" is accepted by Intl).
    expect(formatCurrencyFromCents(12345, "US")).toBe("123.45 US");
  });
});

describe("compact formatters", () => {
  it("formats large money compactly", () => {
    // 12.5 million of display currency = 1_250_000_000 cents; same vi-VN
    // separators as the full format, so the two never disagree on a screen.
    expect(formatCompactCurrencyFromCents(1_250_000_000)).toMatch(/^12,5\sTr\s₫$/);
  });

  it("formats large counts compactly", () => {
    expect(formatCompactNumber(18432)).toBe("18.4K");
  });
});

describe("formatPercent", () => {
  it("turns a 0–1 fraction into a percentage string", () => {
    expect(formatPercent(0.037)).toBe("3.7%");
  });
});

describe("formatDate", () => {
  it("returns a dash for missing or invalid input", () => {
    expect(formatDate(undefined)).toBe("-");
    expect(formatDate("not-a-date")).toBe("-");
  });
});

describe("initialsFromName", () => {
  it("takes first+last initials from a full name", () => {
    expect(initialsFromName("An Nguyen")).toBe("AN");
  });
  it("handles a single name", () => {
    expect(initialsFromName("Cher")).toBe("CH");
  });
  it("never throws on empty input", () => {
    expect(initialsFromName("")).toBe("?");
  });
});
