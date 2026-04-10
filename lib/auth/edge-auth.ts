import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge-safe route guard.
 *
 * IMPORTANT: Do NOT import NextAuth here. NextAuth depends on Node.js `crypto`,
 * which is not available in the edge runtime and will crash requests.
 *
 * This guard uses a lightweight cookie-presence check to decide whether to redirect
 * to `/sign-in`. Authorization is still enforced server-side in routes via
 * `requireUser()` / `resolveTenantContext()`.
 */
/**
 * Detect session cookie presence without decoding JWT (edge-safe).
 * Auth.js may split large JWTs into chunked cookies (`name.0`, `name.1`, …).
 * Exact-name checks alone treat logged-in users as logged out → middleware
 * redirects every `/workspace/*` navigation to sign-in.
 */
function hasAuthCookie(req: NextRequest): boolean {
  for (const { name } of req.cookies.getAll()) {
    if (
      name === "authjs.session-token" ||
      name.startsWith("authjs.session-token.") ||
      name === "__Secure-authjs.session-token" ||
      name.startsWith("__Secure-authjs.session-token.") ||
      name === "__Host-authjs.session-token" ||
      name.startsWith("__Host-authjs.session-token.") ||
      name === "next-auth.session-token" ||
      name.startsWith("next-auth.session-token.") ||
      name === "__Secure-next-auth.session-token" ||
      name.startsWith("__Secure-next-auth.session-token.")
    ) {
      return true;
    }
  }
  return false;
}

export default function edgeAuth(req: NextRequest) {
  // Server Actions POST with a `next-action` header. Redirecting breaks flight/action protocol.
  if (req.headers.has("next-action")) return NextResponse.next();

  const isAuthenticated = hasAuthCookie(req);
  const isProtectedRoute = req.nextUrl.pathname.startsWith("/workspace");
  const { pathname } = req.nextUrl;

  if (pathname === "/invite/accept") {
    const token = req.nextUrl.searchParams.get("token") ?? "";
    if (!isAuthenticated) {
      const signInUrl = new URL("/sign-in", req.nextUrl.origin);
      signInUrl.searchParams.set(
        "callbackUrl",
        token ? `/invite/accept?token=${encodeURIComponent(token)}` : "/invite/accept"
      );
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
  }

  const inviteMatch = pathname.match(/^\/invite\/([^/]+)$/);
  if (inviteMatch && inviteMatch[1] !== "accept") {
    const token = inviteMatch[1];
    if (!isAuthenticated) {
      const signInUrl = new URL("/sign-in", req.nextUrl.origin);
      signInUrl.searchParams.set(
        "callbackUrl",
        `/invite/accept?token=${encodeURIComponent(token)}`
      );
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
  }

  if (isProtectedRoute && !isAuthenticated) {
    const signInUrl = new URL("/sign-in", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

