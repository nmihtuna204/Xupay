import { describe, expect, it } from "vitest";
import { transferSchema } from "./TransferForm.schema";
import { amountSchema } from "./AmountForm.schema";

// A canonical RFC-4122 UUID (version 4, variant 8) — the all-1s string is
// NOT a valid UUID (its variant nibble must be 8/9/a/b), which is exactly
// why zod's .uuid() rejects it.
const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("transferSchema", () => {
  it("accepts a valid recipient UUID and positive amount", () => {
    const result = transferSchema.safeParse({
      recipientUserId: VALID_UUID,
      amount: 100,
      description: "Dinner",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-UUID recipient", () => {
    const result = transferSchema.safeParse({ recipientUserId: "bob", amount: 100 });
    expect(result.success).toBe(false);
  });

  it("rejects a zero or negative amount", () => {
    expect(transferSchema.safeParse({ recipientUserId: VALID_UUID, amount: 0 }).success).toBe(false);
    expect(transferSchema.safeParse({ recipientUserId: VALID_UUID, amount: -5 }).success).toBe(false);
  });

  it("coerces a numeric string amount to a number", () => {
    const result = transferSchema.safeParse({ recipientUserId: VALID_UUID, amount: "250" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(250);
  });
});

describe("amountSchema", () => {
  it("requires a positive amount", () => {
    expect(amountSchema.safeParse({ amount: 50 }).success).toBe(true);
    expect(amountSchema.safeParse({ amount: 0 }).success).toBe(false);
  });
});
