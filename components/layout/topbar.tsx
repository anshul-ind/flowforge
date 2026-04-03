import type { User } from '@/types/next-auth';
import { SignOutButton } from './sign-out-button';
import { NotificationPopover } from '@/components/notification/notification-popover';
import { TopbarSearchInput } from './topbar-search-input';

interface TopbarProps {
  user: User | null;
  workspaceId?: string;
}

/**
 * Topbar Component - PHASE 3
 * 
 * Server Component
 * 
 * Top navigation bar with search, notifications, and user profile.
 * Uses design tokens for all colors, spacing, and typography.
 * 
 * Features:
 * - 52px fixed height sticky header
 * - Search input (left side)
 * - Notifications popover (center-right)
 * - User profile menu (right side)
 * - Token-based styling
 * - Full responsive support
 * 
 * Accessibility:
 * - Semantic header element with role="banner"
 * - Proper focus management for interactive elements
 * - Aria labels on all buttons
 * - Keyboard navigation support
 * 
 * @param user - Current authenticated user
 * @param workspaceId - Current workspace ID for notifications
 */
export function Topbar({ user, workspaceId }: TopbarProps) {
  if (!user) return null;

  const userInitial = user.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <header 
      className="sticky top-0 z-40 flex h-13 items-center justify-between border-b border-black bg-transparent px-6 py-3"
      role="banner"
    >
      {/* Left: Search input */}
      <div className="flex-1">
        {workspaceId && <TopbarSearchInput workspaceId={workspaceId} />}
      </div>

      {/* Right: Notifications and user menu */}
      <div className="flex items-center gap-4">
        {/* Notifications Popover */}
        {workspaceId && <NotificationPopover workspaceId={workspaceId} />}

        {/* User profile section with divider */}
        <div className="flex items-center gap-3 border-l border-border pl-4">
          {/* User Avatar */}
          <div 
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-black font-semibold text-white text-sm"
            aria-label={`${user.name || 'User'} avatar`}
            title={user.name || user.email || 'User'}
          >
            {userInitial}
          </div>

          {/* User info and sign-out button */}
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-black truncate">
              {user.name || user.email || 'User'}
            </span>
            <SignOutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
