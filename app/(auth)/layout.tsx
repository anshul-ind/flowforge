import type { ReactNode } from "react";

/**
 * Auth segment layout: chrome only.
 * Redirect-when-signed-in lives on each page so `callbackUrl` (e.g. invite) is preserved.
 */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface-alt to-bg-secondary">
      {children}
    </div>
  );
}
