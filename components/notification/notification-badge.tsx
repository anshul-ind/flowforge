'use client';

import { useEffect, useState } from 'react';
import { getUnreadCountAction } from '@/modules/notification/list-action';

interface NotificationBadgeProps {
  workspaceId: string;
}

/**
 * Notification Badge
 * Shows unread notification count in bell icon
 */
export function NotificationBadge({
  workspaceId,
}: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load initial count
    loadUnreadCount();

    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [workspaceId]);

  async function loadUnreadCount() {
    setIsLoading(true);
    const result = await getUnreadCountAction(workspaceId);
    if (result.success && result.data) {
      setUnreadCount(result.data.count);
    }
    setIsLoading(false);
  }

  // Show badge only if there are unread notifications
  if (unreadCount === 0) {
    return null;
  }

  return (
    <span
      className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-indigo-600 rounded-full"
      aria-label={`${unreadCount} unread notifications`}
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
}
