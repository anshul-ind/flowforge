import type { ReactNode } from "react";
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

/**
 * Auth Layout
 * 
 * Wrapper for all auth pages: sign-in, sign-up
 * 
 * Behavior:
 * - If user is already signed in, redirect to /workspace
 * - Otherwise, show auth pages
 */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  // Redirect to workspace if already signed in
  if (session?.user) {
    redirect('/workspace');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {children}
    </div>
  );
}
