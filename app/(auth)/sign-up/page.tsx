"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth/signup-action";
import { Building2, Zap } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent") || null;
  const callbackUrlParam = searchParams.get("callbackUrl") || null;
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIntent, setSelectedIntent] = useState<"personal" | "team" | null>(intent as any);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedIntent) {
      setError("Please select how you want to use FlowForge");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("confirmPassword", confirmPassword);
      if (name) formData.append("name", name);
      formData.append("userType", selectedIntent);

      const result = await signUp(formData);

      if (!result.success) {
        // Prefer field-level Zod messages so users see what to fix.
        // (The server currently returns message = "Validation failed" plus `fieldErrors`.)
        if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
          const allMessages = Object.values(result.fieldErrors).flat();
          setError(allMessages[0] || result.message || "Validation failed");
        } else {
          const errorMessage = result.formError || result.message || "Failed to create account";
          setError(errorMessage);
        }
        setIsLoading(false);
        return;
      }

      // Auto sign-in after successful registration
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.ok) {
        const decodedCallbackUrl = (() => {
          if (!callbackUrlParam) return null;
          try {
            return decodeURIComponent(callbackUrlParam);
          } catch {
            return callbackUrlParam;
          }
        })();

        // Redirect based on invite/signup callback first
        if (decodedCallbackUrl) {
          router.push(decodedCallbackUrl);
        } else if (selectedIntent === "personal") {
          router.push("/workspace");
        } else {
          router.push("/workspace/new");
        }
        router.refresh();
      } else {
        router.push("/sign-in?registered=true");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  // Show intent selection if not selected
  if (!selectedIntent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-3">
              Welcome to FlowForge
            </h1>
            <p className="text-lg text-secondary">
              Choose how you want to get started
            </p>
          </div>

          {/* Option Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Option */}
            <button
              onClick={() => setSelectedIntent("personal")}
              className="p-8 rounded-xl border-2 border-border hover:border-brand hover:shadow-lg transition-all duration-300 bg-surface-raised text-left group"
            >
              <div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand/20 transition-colors">
                <Zap className="w-6 h-6 text-brand" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">
                ⭐ Explore FlowForge
              </h3>
              <p className="text-secondary text-sm">
                Create your personal workspace and manage projects for yourself. Perfect for individuals and freelancers.
              </p>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-medium text-brand">Get started instantly</p>
              </div>
            </button>

            {/* Team Option */}
            <button
              onClick={() => setSelectedIntent("team")}
              className="p-8 rounded-xl border-2 border-border hover:border-brand hover:shadow-lg transition-all duration-300 bg-surface-raised text-left group"
            >
              <div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand/20 transition-colors">
                <Building2 className="w-6 h-6 text-brand" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">
                👥 Join as Team Manager
              </h3>
              <p className="text-secondary text-sm">
                Set up an organization workspace. Invite team members, assign roles, and manage projects collaboratively.
              </p>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-medium text-brand">Full team collaboration</p>
              </div>
            </button>
          </div>

          {/* Already have account */}
          <p className="text-center mt-8 text-secondary">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium text-brand hover:text-brand/80">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <button
            onClick={() => setSelectedIntent(null)}
            className="text-sm text-secondary hover:text-primary mb-4 transition-colors"
          >
            ← Back
          </button>
          <h2 className="text-3xl font-bold text-primary">
            {selectedIntent === "personal" ? "Create Your Account" : "Set Up Your Team"}
          </h2>
          <p className="mt-2 text-sm text-secondary">
            {selectedIntent === "personal"
              ? "Start managing your projects today"
              : "Build your team workspace"}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="p-4 rounded-lg bg-danger/10 border border-danger/30">
              <p className="text-sm font-medium text-danger">{error}</p>
            </div>
          )}

          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={selectedIntent === "personal" ? "Your name" : "Your full name"}
              disabled={isLoading}
              className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-50"
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Email Address {selectedIntent === "team" && "(Company email)"}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={selectedIntent === "team" ? "you@company.com" : "you@example.com"}
              disabled={isLoading}
              required
              className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-50"
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              disabled={isLoading}
              required
              className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-50"
            />
            <p className="text-xs text-muted mt-1">Must be at least 8 characters</p>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              disabled={isLoading}
              required
              className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-50"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg font-medium bg-brand text-black hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mt-6"
          >
            {isLoading ? "Creating account..." : "Create account"}
          </button>

          {/* Sign In Link */}
          <p className="text-center text-sm text-secondary">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium text-brand hover:text-brand/80">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
