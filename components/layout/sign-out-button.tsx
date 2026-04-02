'use client';

import { signOut } from 'next-auth/react';

/**
 * Sign Out Button Component (Client Component)
 * 
 * Separated from Topbar to keep main layout as Server Component
 * This is the only part that needs 'use client' directive
 */
export function SignOutButton() {
  async function handleSignOut() {
    await signOut({ callbackUrl: '/sign-in' });
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-xs text-gray-500 hover:text-blue-600 transition-colors font-medium"
      aria-label="Sign out"
    >
      Sign out
    </button>
  );
}
