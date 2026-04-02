import { signOut } from '@/auth';

/**
 * Sign Out Route Handler
 * 
 * GET /auth/sign-out → signs out and redirects to /sign-in
 * 
 * Fallback for users who can't use the form action.
 * Returns a button link to this route as a simple way to sign out.
 * 
 * Example usage in HTML:
 * <a href="/sign-out" class="btn">Sign Out</a>
 */
export async function GET() {
  await signOut({ redirectTo: '/sign-in' });
}
