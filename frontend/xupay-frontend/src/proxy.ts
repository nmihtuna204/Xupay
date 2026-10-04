import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Server-side route guard for the (app) route group.
 *
 * Next.js 16 renamed the `middleware.ts` file convention to `proxy.ts` (the
 * exported function must be named `proxy`, not `middleware` — see
 * node_modules/next/dist/docs/.../file-conventions/proxy.md). Proxy always
 * runs on the Node.js runtime now, no edge option.
 *
 * It only checks the non-sensitive `xupay_session` flag cookie (see
 * lib/session.ts), not the JWT: that is the HttpOnly `xupay_token` cookie,
 * issued by user-service for the API's host — good enough to redirect
 * logged-out visitors away from protected routes without a flash of
 * protected content. The real authorization check still happens on every
 * API call, which the browser sends with the token cookie.
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/wallets",
  "/payments",
  "/transactions",
  "/contacts",
  "/kyc",
  "/settings",
  "/fraud",
  "/compliance",
  "/analytics",
  "/audit",
  "/admin",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !request.cookies.has("xupay_session")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)",
  ],
};
