'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, FolderKanban, CheckSquare, Bell, Menu } from 'lucide-react';

interface MobileNavProps {
  workspaceId: string;
  notifCount?: number;
}

/**
 * Mobile Navigation - PHASE 3
 * 
 * Client Component
 * 
 * Bottom navigation bar for mobile devices (<768px).
 * Shows 5 primary navigation tabs with active state detection.
 * 
 * Features:
 * - 5 navigation tabs: Home, Projects, Tasks, Notifications, Menu
 * - Active state derived from current pathname
 * - Badge support on Notifications tab (shows count)
 * - 60px height with safe-area-inset-bottom for notch devices
 * - Hidden on desktop (md:hidden)
 * - Token-based styling
 * - Smooth transitions on active state
 * 
 * Accessibility:
 * - Semantic nav element
 * - Proper aria labels on buttons
 * - Clear active state indication
 * - Touch-friendly tap targets (48x48px minimum)
 * 
 * @param workspaceId - Current workspace ID for navigation links
 * @param notifCount - Number of unread notifications (optional)
 */
export function MobileNav({ workspaceId, notifCount = 0 }: MobileNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === `/workspace/${workspaceId}`) {
      return pathname === href || pathname.startsWith(`${href}/`);
    }
    return pathname.startsWith(href);
  };

  const navItems = [
    {
      label: 'Home',
      href: `/workspace/${workspaceId}`,
      icon: Home,
      testId: 'mobile-nav-home',
    },
    {
      label: 'Projects',
      href: `/workspace/${workspaceId}/projects`,
      icon: FolderKanban,
      testId: 'mobile-nav-projects',
    },
    {
      label: 'Tasks',
      href: `/workspace/${workspaceId}/tasks`,
      icon: CheckSquare,
      testId: 'mobile-nav-tasks',
    },
    {
      label: 'Notifications',
      href: `/workspace/${workspaceId}/notifications`,
      icon: Bell,
      badge: notifCount > 0 ? (notifCount > 9 ? '9+' : notifCount) : null,
      testId: 'mobile-nav-notifications',
    },
    {
      label: 'Menu',
      href: `/workspace/${workspaceId}/menu`,
      icon: Menu,
      testId: 'mobile-nav-menu',
    },
  ];

  return (
    <nav 
      className="flex md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-surface"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      aria-label="Mobile navigation"
    >
      {/* Flex container for tab items */}
      <div className="flex w-full items-center justify-around px-2 pb-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors duration-200 ${
                active
                  ? 'text-brand'
                  : 'text-secondary hover:text-primary'
              }`}
              aria-label={item.label}
              title={item.label}
              data-testid={item.testId}
            >
              {/* Icon with badge support */}
              <div className="relative">
                <Icon 
                  size={24} 
                  className={active ? 'fill-current' : ''}
                  aria-hidden="true"
                />
                
                {/* Badge - shown on notifications if count > 0 */}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-xs font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={active ? 'text-brand' : 'text-secondary'}>
                {item.label}
              </span>

              {/* Active indicator line */}
              {active && (
                <div className="absolute bottom-0 h-0.5 w-12 bg-brand rounded-full" 
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
