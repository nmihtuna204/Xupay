import { describe, expect, it } from "vitest";
import {
  formatCurrencyFromCents,
  formatCompactCurrencyFromCents,
  formatCompactNumber,
  formatPercent,
  formatDate,
  initialsFromName,
} from "./format";

describe("formatCurrencyFromCents", () => {
  it("divides cents by 100 and forces 2 decimals", () => {
    // 50000 cents -> 500.00 of display currency
    expect(formatCurrencyFromCents(50000, "VND")).toContain("500.00");
  });

  it("never crashes on an invalid currency code", () => {
    // A 2-letter code is malformed, so Intl throws and we hit the safe
    // fallback (a well-formed 3-letter code like "ZZZ" is accepted by Intl).
    expect(formatCurrencyFromCents(12345, "US")).toBe("123.45 US");
  });
});

describe("compact formatters", () => {
  it("formats large money compactly", () => {
    // 12.5M of display currency = 1_250_000_000 cents
    expect(formatCompactCurrencyFromCents(1_250_000_000)).toMatch(/12\.5M/);
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
  it("returns an em dash for missing or invalid input", () => {
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("not-a-date")).toBe("—");
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
