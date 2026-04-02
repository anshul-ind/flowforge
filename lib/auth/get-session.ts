import { auth } from '@/auth';

/**
 * Get current session in Server Components or Server Actions
 * 
 * @returns Session object if authenticated, null otherwise
 * 
 * @example
 * // In a Server Component
 * export default async function DashboardPage() {
 *   const session = await getSession();
 *   if (!session) {
 *     return <div>Not logged in</div>;
 *   }
 *   return <div>Welcome {session.user.email}</div>;
 * }
 * 
 * @example
 * // In a Server Action
 * export async function createProject() {
 *   'use server';
 *   const session = await getSession();
 *   if (!session) {
 *     return errorResult('Not authenticated');
 *   }
 *   // ... create project
 * }
 */
export async function getSession() {
  return await auth();
}

/**
 * When to use getSession():
 * - When you want to optionally check authentication
 * - When you need to handle unauthenticated state yourself
 * - When you want to show different UI for logged-in vs logged-out users
 * - In layouts or components that should work for both states
 */
