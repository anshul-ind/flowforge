"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import {
  googleOAuthCallbackUrl,
  postAuthRedirectPath,
} from "@/lib/auth/post-auth-path";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  Configuration:
    "Sign-in is not configured correctly. Check Google OAuth env vars and callback URL.",
  AccessDenied: "Sign-in was cancelled or denied.",
  Verification: "The sign-in link expired or was already used.",
  OAuthSignin: "Could not start Google sign-in.",
  OAuthCallback: "Google returned an error. Try again.",
  OAuthAccountNotLinked:
    "This email uses a different sign-in method. Try email and password, or contact support.",
  Default: "Sign-in failed. Try again or use another method.",
};

export function SignInClient({
  googleAuthEnabled,
  authError,
}: {
  googleAuthEnabled: boolean;
  authError?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(
    authError ? OAUTH_ERROR_MESSAGES[authError] ?? OAUTH_ERROR_MESSAGES.Default : ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const postAuthPath = postAuthRedirectPath(searchParams.get("callbackUrl"));

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await signIn("google", {
        callbackUrl: googleOAuthCallbackUrl(searchParams.get("callbackUrl")),
      });
    } catch {
      setError("Could not start Google sign-in");
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setIsLoading(false);
      } else if (result?.ok) {
        router.push(postAuthPath);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen overflow-y-auto">
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-gradient-to-br from-brand to-brand-dark p-12 text-black">
        <div>
          <div className="mb-8">
            <div className="inline-flex items-center justify-center rounded-lg bg-white/20 p-2 backdrop-blur">
              <img
                src="/assets/logo1.png"
                alt=""
                width={200}
                height={56}
                className="h-10 w-auto object-contain"
              />
            </div>
          </div>
          <h1 className="text-5xl font-bold tracking-tight">FlowForge</h1>
          <p className="mt-4 text-lg text-black/80">
            Manage projects. Collaborate seamlessly. Deliver faster.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Real-time Collaboration</h3>
              <p className="mt-1 text-sm text-black/70">Work together with your team in real-time</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Advanced Analytics</h3>
              <p className="mt-1 text-sm text-black/70">Track progress with powerful insights</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Enterprise Security</h3>
              <p className="mt-1 text-sm text-black/70">Bank-grade security for your data</p>
            </div>
          </div>
        </div>

        <div className="text-sm text-white/70">© 2026 FlowForge. All rights reserved.</div>
      </div>

      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-6 py-12 sm:px-8 lg:px-12">
        <div className="w-full max-w-lg space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-primary">Welcome back</h2>
            <p className="text-base text-secondary">Sign in to your account to continue</p>
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-danger-300 bg-danger-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-danger" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-danger">{error}</p>
              </div>
            </div>
          )}

 

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-primary">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-primary placeholder:text-tertiary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-50 sm:text-sm"
                placeholder="you@example.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-primary">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-brand hover:text-brand-dark transition-colors"
                  title="Forgot your password?"
                >
                  Forgot?
                </Link>
              </div>
              <div className="mt-2 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-border bg-surface px-4 py-2.5 pr-10 text-primary placeholder:text-tertiary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-50 sm:text-sm"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-black px-4 py-2.5 font-semibold text-white transition-colors hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

       
        </div>
        <div className="w-full max-w-lg space-y-8 border border-white/10 h-10 "> 
        <div className="relative flex justify-center text-sm">
                  <span className="bg-surface px-2 text-tertiary  p-2 h-12">Or use Google</span>
                </div></div>



        {googleAuthEnabled ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => void handleGoogle()}
                disabled={googleLoading || isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {googleLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Redirecting…
                  </span>
                ) : (
                  <>Continue with Google</>
                )}
              </button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  {/* <div className="w-full border-t border-border" /> */}
                </div>
              
              </div>
            </div>
          ) : null} 
           
           <div className="text-center">
            <p className="text-sm text-secondary">
              Don&apos;t have an account?{" "}
              <Link
                href="/sign-up"
                className="font-semibold text-brand hover:text-brand-dark transition-colors"
              >
                Create one now
              </Link>
            </p>
          </div>
      </div>
    </div>
  );
}
