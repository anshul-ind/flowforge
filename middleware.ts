import handler from "@/lib/auth/edge-auth";

export default handler;

// Must be statically analyzable; cannot be re-exported from another module.
export const config = {
  matcher: ["/workspace/:path*", "/invite/:path*"],
};
