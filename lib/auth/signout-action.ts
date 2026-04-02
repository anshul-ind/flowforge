'use server';

import { signOut as authSignOut } from '@/auth';

/**
 * Sign Out Server Action
 * 
 * Destroys the user session and redirects to sign-in page.
 * This is a simple wrapper around next-auth signOut().
 * 
 * Usage:
 * - Form action: <form action={signOutAction}><button>Sign Out</button></form>
 * - Server Component: Call directly or wrap in a client component
 * 
 * Behavior:
 * - Clears JWT session cookie
 * - Redirects to /sign-in automatically
 * - No return value (signOut redirects the page)
 */
export async function signOutAction() {
  await authSignOut({ redirectTo: '/sign-in' });
}
