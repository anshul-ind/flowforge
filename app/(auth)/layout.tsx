import type { ReactNode } from "react";
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

/**
 * Auth Layout - PHASE 4
 * 
 * Wrapper for all auth pages: sign-in, sign-up
 * 
 * Features:
 * - Token-based background gradient
 * - Automatic redirect if already authenticated
 * - Full-screen responsive layout
 * - Accessibility-ready structure
 * 
 * Behavior:
 * - If user is already signed in → redirect to /workspace
 * - Otherwise → show auth pages with gradient background
 */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  // Redirect to workspace if already signed in
  if (session?.user) {
    redirect('/workspace');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface-alt to-bg-secondary">
      {children}
    </div>
  );
}
