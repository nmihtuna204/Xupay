import { afterEach, describe, expect, it, vi } from "vitest";
import { clearSession, hasSession, markSignedIn, subscribeToSession } from "./session";

describe("session flag", () => {
  afterEach(() => {
    clearSession();
    localStorage.clear();
  });

  it("marks and clears the signed-in flag for render and for proxy.ts", () => {
    expect(hasSession()).toBe(false);

    markSignedIn();
    expect(hasSession()).toBe(true);
    expect(document.cookie).toContain("xupay_session=1");

    clearSession();
    expect(hasSession()).toBe(false);
    expect(document.cookie).not.toContain("xupay_session=1");
  });

  it("keeps no token in script-readable storage, and drops one left by the old localStorage scheme", () => {
    localStorage.setItem("xupay_token", "old.jwt.token");

    markSignedIn();

    expect(localStorage.getItem("xupay_token")).toBeNull();
    expect(Object.keys(localStorage)).toEqual(["xupay_session"]);
    expect(document.cookie).not.toContain("xupay_token");
  });

  it("tells subscribers in this tab about sign-in and sign-out", () => {
    const onChange = vi.fn();
    const unsubscribe = subscribeToSession(onChange);

    markSignedIn();
    clearSession();
    expect(onChange).toHaveBeenCalledTimes(2);

    unsubscribe();
    markSignedIn();
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});
