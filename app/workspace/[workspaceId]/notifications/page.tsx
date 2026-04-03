import { requireUser } from '@/lib/auth/require-user';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { NotificationService } from '@/modules/notification/service';
import { NotificationList } from '@/components/notifications/notification-list';
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

  const { total } = await service.listNotifications({
    workspaceId,
    limit: 50,
    offset: 0,
    unreadOnly: false,
  });

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

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Activity</h2>
          <NotificationList
            workspaceId={workspaceId}
            userId={user.id}
            limit={50}
          />
        </div>
      </div>
    </div>
  );
}
