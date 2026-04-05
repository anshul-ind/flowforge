import { Suspense } from "react";
import { SignInClient } from "./sign-in-client";

function SignInFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-gray-600">Loading…</div>
  );
}

export default function SignInPage() {
  const googleAuthEnabled = Boolean(
    (process.env.AUTH_GOOGLE_ID?.trim() || process.env.GOOGLE_ID?.trim()) &&
      (process.env.AUTH_GOOGLE_SECRET?.trim() || process.env.GOOGLE_SECRET?.trim())
  );

  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInClient googleAuthEnabled={googleAuthEnabled} />
    </Suspense>
  );
}
