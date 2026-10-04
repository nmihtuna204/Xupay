import { describe, expect, it } from "vitest";
import { parsePage } from "./TransactionsClient";

describe("parsePage", () => {
  it("reads a zero-based page", () => {
    expect(parsePage("3")).toBe(3);
    expect(parsePage("0")).toBe(0);
  });

  it.each([null, "", "abc", "-2", "1.5", "Infinity"])("treats %j as the first page", (value) => {
    expect(parsePage(value)).toBe(0);
  });
});
