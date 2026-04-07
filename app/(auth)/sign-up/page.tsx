import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { safeCallbackPath } from "@/lib/auth/safe-callback-path";
import { SignUpClient } from "./sign-up-client";

function SignUpFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-gray-600">Loading…</div>
  );
}

export default async function SignUpPage({
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

  return (
    <Suspense fallback={<SignUpFallback />}>
      <SignUpClient />
    </Suspense>
  );
}
