import { afterEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { createApiClient } from "./client-factory";

const BASE = "http://api.xupay.test";

describe("createApiClient", () => {
  afterEach(() => localStorage.clear());

  it("lets the browser send the HttpOnly token cookie, with the header the services require for it", async () => {
    let headers: Headers | undefined;
    server.use(
      http.post(`${BASE}/api/payments/transfer`, ({ request }) => {
        headers = request.headers;
        return HttpResponse.json({ ok: true });
      })
    );
    // A token left in localStorage by the old scheme must not be sent.
    localStorage.setItem("xupay_token", "old.jwt.token");
    const client = createApiClient(BASE);

    await client.post("/api/payments/transfer", { amountCents: 100 });

    expect(client.defaults.withCredentials).toBe(true);
    expect(headers?.get("x-requested-with")).toBe("XMLHttpRequest");
    expect(headers?.get("authorization")).toBeNull();
  });

  it("surfaces the server's message for a blocked sign-in", async () => {
    server.use(
      http.post(`${BASE}/api/auth/login`, () =>
        HttpResponse.json(
          { status: 429, message: "Too many failed sign-in attempts. Try again in 15 minutes." },
          { status: 429, headers: { "Retry-After": "900" } }
        )
      )
    );

    await expect(createApiClient(BASE).post("/api/auth/login", {})).rejects.toMatchObject({
      statusCode: 429,
      message: "Too many failed sign-in attempts. Try again in 15 minutes.",
      isAuthError: false,
    });
  });
});
