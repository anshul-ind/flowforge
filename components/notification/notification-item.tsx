'use client';

import { useOptimistic } from 'react';
import { markNotificationReadAction } from '@/modules/notification/list-action';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

interface NotificationItemProps {
  id: string;
  message: string;
  type: string;
  workspaceId: string;
  isRead: boolean;
  createdAt: Date;
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

/**
 * Notification Item
 * Single notification in the list or popover
 */
export function NotificationItem({
  id,
  message,
  type,
  isRead,
  createdAt,
  user,
}: NotificationItemProps) {
  // Optimistic update for marking as read
  const [optimisticRead, setOptimisticRead] = useOptimistic(isRead);

  async function handleClick() {
    if (!optimisticRead) {
      setOptimisticRead(true);
      await markNotificationReadAction(id);
    }
  }

  // Icon and color based on type
  const typeConfig = {
    TASK_ASSIGNED: {
      icon: '📌',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    USER_MENTIONED: {
      icon: '@',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    APPROVAL_REQUESTED: {
      icon: '✓',
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
    },
    APPROVAL_APPROVED: {
      icon: '✓',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    APPROVAL_REJECTED: {
      icon: '✗',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    COMMENT_ADDED: {
      icon: '💬',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  }[type] || {
    icon: '•',
    color: 'text-slate-400',
    bgColor: 'bg-slate-50',
  };

  return (
    <button
      onClick={handleClick}
      className={clsx(
        'w-full px-4 py-3 text-left border-b border-slate-100 hover:bg-slate-50 transition-colors group',
        optimisticRead ? 'bg-white' : typeConfig.bgColor
      )}
    >
      <div className="flex gap-3">
        {/* Unread indicator dot */}
        {!optimisticRead && (
          <div className="mt-2 h-2 w-2 rounded-full bg-indigo-600 flex-shrink-0" />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <p className="text-sm font-medium text-slate-900 line-clamp-2 flex-1">
              {message}
            </p>
            <span className={clsx('text-lg font-semibold flex-shrink-0', typeConfig.color)}>
              {typeConfig.icon}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            {user?.name && <span>{user.name}</span>}
            <span>
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
