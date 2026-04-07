import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { safeCallbackPath } from "@/lib/auth/safe-callback-path";
import { SignInClient } from "./sign-in-client";

function SignInFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-gray-600">Loading…</div>
  );
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const sp = await searchParams;
  const rawCb = typeof sp.callbackUrl === "string" ? sp.callbackUrl : undefined;
  if (session?.user) {
    redirect(safeCallbackPath(rawCb) ?? "/workspace/redirects");
  }

  const googleAuthEnabled = Boolean(
    (process.env.AUTH_GOOGLE_ID?.trim() || process.env.GOOGLE_ID?.trim()) &&
      (process.env.AUTH_GOOGLE_SECRET?.trim() || process.env.GOOGLE_SECRET?.trim())
  );

  const authError =
    typeof sp.error === "string" && sp.error.trim() !== "" ? sp.error.trim() : undefined;

  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInClient googleAuthEnabled={googleAuthEnabled} authError={authError} />
    </Suspense>
  );
}
