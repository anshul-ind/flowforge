'use client';

import { useState, useEffect } from 'react';
import { NotificationItem } from './notification-item';
import { NotificationBadge } from './notification-badge';
import Link from 'next/link';
import {
  listNotificationsAction,
  markAllNotificationsReadAction,
} from '@/modules/notification/list-action';
import { Button } from '@/components/ui/button';

interface NotificationPopoverProps {
  workspaceId: string;
}

/**
 * Notification Popover
 * 380px × 480px popover showing latest 20 notifications
 * Accessible from bell icon in topbar
 */
export function NotificationPopover({
  workspaceId,
}: NotificationPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, workspaceId]);

  async function loadNotifications() {
    setIsLoading(true);
    const result = await listNotificationsAction(workspaceId, {
      limit: 20,
      offset: 0,
    });

    if (result.success && result.data) {
      setNotifications(result.data.notifications);
      setUnreadCount(
        result.data.notifications.filter((n: any) => !n.isRead).length
      );
    }
    setIsLoading(false);
  }

  async function handleMarkAllRead() {
    const result = await markAllNotificationsReadAction(workspaceId);
    if (result.success) {
      setNotifications(
        notifications.map((n) => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    }
  }

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 transition-colors"
        aria-label="Notifications"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        <NotificationBadge workspaceId={workspaceId} />
      </button>

      {/* Popover Panel */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 flex flex-col"
          style={{ height: '480px' }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Notifications</h2>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-500">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-500">No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  {...notification}
                  workspaceId={workspaceId}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-200">
            <Link href={`/workspace/${workspaceId}/notifications`}>
              <Button variant="secondary" className="w-full">
                See all notifications
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Close popover when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
