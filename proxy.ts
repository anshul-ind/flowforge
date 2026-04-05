import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
  // Server Actions POST with a `next-action` header. Running auth redirects on those
  // requests breaks the flight/action protocol and the client shows "Failed to fetch".
  if (req.headers.has("next-action")) {
    return NextResponse.next();
  }

  const isAuthenticated = !!req.auth;
  const isProtectedRoute = req.nextUrl.pathname.startsWith("/workspace");
  const { pathname } = req.nextUrl;

  // Invite: canonical ?token= flow (production emails); preserve callback in query only.
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

  // Legacy /invite/{token} (older links)
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
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};