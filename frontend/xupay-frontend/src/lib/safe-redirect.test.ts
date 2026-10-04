import { describe, expect, it } from "vitest";
import { safeRedirect } from "./safe-redirect";

const ORIGIN = "https://app.xupay.test";

describe("safeRedirect", () => {
  it("follows same-origin paths, keeping query and hash", () => {
    expect(safeRedirect("/wallets", ORIGIN)).toBe("/wallets");
    expect(safeRedirect("/transactions?page=2#top", ORIGIN)).toBe("/transactions?page=2#top");
  });

  it("falls back to the dashboard without a usable value", () => {
    expect(safeRedirect(null, ORIGIN)).toBe("/dashboard");
    expect(safeRedirect("", ORIGIN)).toBe("/dashboard");
    expect(safeRedirect("wallets", ORIGIN)).toBe("/dashboard");
  });

  it.each([
    ["absolute URL", "https://evil.example/phish"],
    ["protocol-relative", "//evil.example"],
    ["backslash spelling", "/\\evil.example"],
    // The URL parser strips tabs and newlines, so these resolve to //evil.example
    ["tab between the slashes", "/\t/evil.example"],
    ["newline between the slashes", "/\n/evil.example"],
    ["carriage return between the slashes", "/\r/evil.example"],
    ["javascript: URL", "javascript:alert(1)"],
  ])("refuses an off-site target (%s)", (_label, from) => {
    expect(safeRedirect(from, ORIGIN)).toBe("/dashboard");
  });

  it("keeps an encoded double slash on this origin", () => {
    // Stays a path on our own site (a 404 at worst), never another host
    expect(safeRedirect("/%2F%2Fevil.example", ORIGIN)).toBe("/%2F%2Fevil.example");
  });
});
