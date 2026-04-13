import { redirect } from 'next/navigation';
import { auth } from '@/auth';

const AUTH_DEBUG = process.env.AUTH_DEBUG === '1';

/**
 * Enforce authentication and get current user
 * 
 * If user is not authenticated, redirects to /sign-in
 * Otherwise returns the authenticated user object
 * 
 * @returns User object from session
 * @throws Redirects to /sign-in if not authenticated
 * 
 * @example
 * // In a Server Component (page that requires auth)
 * export default async function ProtectedPage() {
 *   const user = await requireUser();
 *   // User is guaranteed to be authenticated here
 *   return <div>Hello {user.email}</div>;
 * }
 * 
 * @example
 * // In a Server Action (protected mutation)
 * export async function deleteProject(projectId: string) {
 *   'use server';
 *   const user = await requireUser();
 *   // Only authenticated users can reach this point
 *   await db.project.delete({ where: { id: projectId } });
 * }
 */
export async function requireUser() {
  const session = await auth();
  
  if (!session || !session.user) {
    if (AUTH_DEBUG) {
      console.log('[require-user] redirect', {
        reason: 'no-session-or-user',
        hasAuthSecret: !!process.env.AUTH_SECRET,
        authUrl: process.env.AUTH_URL,
        nodeEnv: process.env.NODE_ENV,
      });
    }
    // User is not authenticated, redirect to sign-in
    redirect('/sign-in');
  }
  
  // User is authenticated, return user object
  if (AUTH_DEBUG) {
    console.log('[require-user] ok', {
      userId: (session.user as any)?.id,
      email: session.user.email,
    });
  }
  return session.user;
}

/**
 * When to use requireUser():
 * - In pages that MUST have an authenticated user
 * - In Server Actions that should only work for logged-in users
 * - When you want automatic redirect behavior
 * - When you don't need to handle the unauthenticated case manually
 * 
 * Difference from getSession():
 * - getSession() returns null if not authenticated (you handle it)
 * - requireUser() redirects if not authenticated (automatic)
 */
