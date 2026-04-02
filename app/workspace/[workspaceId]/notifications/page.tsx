import { requireUser } from '@/lib/auth/require-user';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { NotificationService } from '@/modules/notification/service';
import Link from 'next/link';
import clsx from 'clsx';

/**
 * Notifications Page
 * 
 * Full notifications page with sidebar filtering and date grouping
 * Left sidebar: All | Direct | Mentions | Approvals | Assignments
 * Main area: Notifications with "Only show unread" toggle
 */
export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const user = await requireUser();
  const tenant = await resolveTenantContext(workspaceId, user.id);

  if (!tenant) {
    return <div>Workspace access denied</div>;
  }

  const service = new NotificationService(tenant);

  // Load notifications
  const { notifications, total } = await service.listNotifications({
    workspaceId,
    limit: 50,
    offset: 0,
    unreadOnly: false,
  });

  // Group notifications by date
  const groupedNotifications = groupByDate(notifications);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-48 bg-white border-r border-slate-200 p-4">
        <h2 className="font-semibold text-slate-900 mb-4">Filter</h2>
        <nav className="space-y-2">
          {[
            { label: 'All', value: 'all' },
            { label: 'Direct Assignments', value: 'assignment' },
            { label: 'Mentions', value: 'mention' },
            { label: 'Approvals', value: 'approval' },
          ].map((filter) => (
            <Link
              key={filter.value}
              href={`/workspace/${workspaceId}/notifications?filter=${filter.value}`}
              className={clsx(
                'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
                filter.value === 'all'
                  ? 'bg-indigo-50 text-indigo-900 border-l-2 border-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              {filter.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-600 mt-1">
            {total} total notifications
          </p>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {Object.entries(groupedNotifications).map(([date, items]) => (
            <div key={date}>
              {/* Date Divider */}
              <div className="py-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {date}
                </h3>
              </div>

              {/* Notifications for this date */}
              <div className="space-y-2">
                {items.map((notification: any) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    workspaceId={workspaceId}
                  />
                ))}
              </div>
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">No notifications yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Notification Row Component
 */
function NotificationRow({
  notification,
  workspaceId,
}: {
  notification: any;
  workspaceId: string;
}) {
  const typeColors = {
    TASK_ASSIGNED: 'bg-indigo-100 text-indigo-900',
    TASK_MENTIONED: 'bg-amber-100 text-amber-900',
    APPROVAL_REQUESTED: 'bg-violet-100 text-violet-900',
    APPROVAL_DECIDED: 'bg-green-100 text-green-900',
  };

  const typeIcons = {
    TASK_ASSIGNED: '📌',
    TASK_MENTIONED: '@',
    APPROVAL_REQUESTED: '✓',
    APPROVAL_DECIDED: '✓',
  };

  return (
    <Link href={getEntityPath(notification.entityType, notification.entityId, workspaceId)}>
      <div className={clsx(
        'p-4 rounded-lg border transition-colors hover:bg-slate-50',
        notification.read
          ? 'border-slate-200 bg-white'
          : 'border-indigo-200 bg-blue-50'
      )}>
        <div className="flex gap-3">
          {/* Type Icon */}
          <div className={clsx(
            'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-lg',
            typeColors[notification.type as keyof typeof typeColors] ||
              'bg-slate-100 text-slate-600'
          )}>
            {typeIcons[notification.type as keyof typeof typeIcons] || '•'}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900">{notification.title}</p>
            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
              {notification.body}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {new Date(notification.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Unread Indicator */}
          {!notification.read && (
            <div className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0 mt-2" />
          )}
        </div>
      </div>
    </Link>
  );
}

/**
 * Group notifications by date
 */
function groupByDate(notifications: any[]) {
  const grouped: Record<string, any[]> = {
    Today: [],
    Yesterday: [],
    Earlier: [],
  };

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  notifications.forEach((n) => {
    const notifDate = new Date(n.createdAt).toDateString();

    if (notifDate === today) {
      grouped.Today.push(n);
    } else if (notifDate === yesterday) {
      grouped.Yesterday.push(n);
    } else {
      grouped.Earlier.push(n);
    }
  });

  // Remove empty groups
  return Object.fromEntries(
    Object.entries(grouped).filter(([_, items]) => items.length > 0)
  );
}

/**
 * Get navigation path for entity
 */
function getEntityPath(
  entityType: string,
  entityId: string,
  workspaceId: string
): string {
  switch (entityType) {
    case 'TASK':
      return `/workspace/${workspaceId}/tasks/${entityId}`;
    case 'APPROVAL':
      return `/workspace/${workspaceId}/approvals`;
    default:
      return `/workspace/${workspaceId}/notifications`;
  }
}
