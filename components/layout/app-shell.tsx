import { ReactNode } from 'react';
import type { User } from '@/types/next-auth';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { MobileNav } from './mobile-nav';

interface AppShellProps {
  user: User | null;
  workspaceId: string;
  children: ReactNode;
  notifCount?: number;
}

/**
 * App Shell Container - PHASE 3
 * 
 * Server Component
 * 
 * Main layout wrapper for all authenticated app pages.
 * Composes Sidebar + Topbar + Content + MobileNav with proper responsive behavior.
 * 
 * Structure:
 * - Sidebar (left, hidden <768px)
 * - Flex column (right, full height)
 *   - Topbar (top, sticky)
 *   - Main content (scrollable)
 *   - MobileNav (bottom, visible <768px only)
 * 
 * Features:
 * - Full-screen layout (h-screen with overflow management)
 * - Responsive sidebar (240px desktop, hidden mobile)
 * - Mobile bottom nav with safe-area-inset support
 * - Proper content scrolling with flex-1
 * - Token-based styling
 * - Safe for nested layouts
 * 
 * Accessibility:
 * - Semantic structure (header, nav, main, footer)
 * - Proper ARIA landmarks
 * - Keyboard navigation support
 * - Skip-to-content support ready
 * 
 * @param user - Current authenticated user
 * @param workspaceId - Current workspace ID
 * @param children - Page content to render
 * @param notifCount - Optional notification count for mobile nav badge
 */
export function AppShell({
  user,
  workspaceId,
  children,
  notifCount = 0,
}: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Left Sidebar (desktop only) */}
      <Sidebar user={user} workspaceId={workspaceId} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top navigation bar */}
        <Topbar user={user} workspaceId={workspaceId} />

        {/* Main content - scrollable */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>

        {/* Bottom mobile navigation (mobile only) */}
        <MobileNav workspaceId={workspaceId} notifCount={notifCount} />
      </div>
    </div>
  );
}

/**
 * Flex Row Container
 * Useful for layout composition
 */
export function FlexRow({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`flex flex-row ${className}`}>{children}</div>;
}

/**
 * Flex Column Container
 * Useful for layout composition
 */
export function FlexCol({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`flex flex-col ${className}`}>{children}</div>;
}

/**
 * Main Content Container
 * Wraps page content with consistent padding
 */
export function MainContent({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex-1 overflow-auto bg-gray-50 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
