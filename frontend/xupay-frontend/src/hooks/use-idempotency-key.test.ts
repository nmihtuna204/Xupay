import { afterEach, describe, expect, it } from "vitest";
import { randomUuid } from "./use-idempotency-key";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("randomUuid", () => {
  afterEach(() => {
    // Drop the own-property shadow a test may have put on the global crypto
    delete (crypto as { randomUUID?: unknown }).randomUUID;
  });

  it("returns a v4 UUID", () => {
    expect(randomUuid()).toMatch(UUID_V4);
  });

  it("still works without crypto.randomUUID (plain-HTTP origins)", () => {
    Object.defineProperty(crypto, "randomUUID", { value: undefined, configurable: true });

    const a = randomUuid();
    const b = randomUuid();
    expect(a).toMatch(UUID_V4);
    expect(b).toMatch(UUID_V4);
    expect(a).not.toBe(b);
  });
});
