import type { User } from '@/types/next-auth';
import { SignOutButton } from './sign-out-button';
import { NotificationPopover } from '@/components/notification/notification-popover';
import { TopbarSearchInput } from './topbar-search-input';

interface TopbarProps {
  user: User | null;
  workspaceId?: string;
}

/**
 * Topbar Component (Server Component)
 * 
 * Top navigation bar showing user profile, notifications, and sign-out button
 * NotificationPopover is a client component, imported and used here
 * 
 * @param user - Current authenticated user
 * @param workspaceId - Current workspace ID for notifications
 */
export function Topbar({ user, workspaceId }: TopbarProps) {
  if (!user) return null;

  const userInitial = user.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <header 
      className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between"
      role="banner"
    >
      {/* Left: search input */}
      {workspaceId && <TopbarSearchInput workspaceId={workspaceId} />}

      {/* Right: notifications and user menu */}
      <div className="flex items-center gap-4">
        {/* Notifications Popover */}
        {workspaceId && <NotificationPopover workspaceId={workspaceId} />}

        {/* User profile section */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          {/* Avatar */}
          <div 
            className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm"
            aria-label={`${user.name || 'User'} avatar`}
          >
            {userInitial}
          </div>

          {/* User name and sign-out */}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">
              {user.name || user.email || 'User'}
            </span>
            <SignOutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
