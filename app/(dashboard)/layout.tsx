import { requireUser } from '@/lib/auth/require-user';

/**
 * Dashboard Layout Shell
 * 
 * Parents the layout group "(dashboard)" which includes auth-protected routes.
 * This represents the main app experience (workspace/project pages).
 * 
 * Responsibilities:
 * 1. Ensure user is authenticated (requireUser redirects to /sign-in if needed)
 * 2. Provide layout structure (will be extended in workspace layout)
 * 3. Render children (nested routes)
 * 
 * Does NOT fetch workspace data — that happens in workspace/[workspaceId]/layout.tsx
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce authentication before any dashboard route renders
  await requireUser();

  return <>{children}</>;
}
