import { prisma } from '@/lib/db'
import { formatDistanceToNow } from 'date-fns'
import { MarkNotificationReadControl } from '@/components/notifications/mark-notification-read-control'

export type NotificationListItem = {
  id: string
  type: string
  message: string
  isRead: boolean
  createdAt: Date
  entityType: string | null
  entityId: string | null
}

export async function NotificationList({
  workspaceId,
  userId,
  limit = 30,
}: {
  workspaceId: string
  userId: string
  limit?: number
}) {
  const rows = await prisma.notification.findMany({
    where: { userId, workspaceId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  const items: NotificationListItem[] = rows.map((n) => ({
    id: n.id,
    type: n.type,
    message: n.message,
    isRead: n.isRead,
    createdAt: n.createdAt,
    entityType: n.entityType,
    entityId: n.entityId,
  }))

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-500">
          No notifications in this workspace.
        </p>
      ) : (
        items.map((n) => (
          <div
            key={n.id}
            className={`rounded-lg border p-4 transition-colors ${
              n.isRead
                ? 'border-neutral-200 bg-white'
                : 'border-indigo-200 bg-indigo-50/40'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {n.type.replace(/_/g, ' ')}
                  </span>
                  {!n.isRead && (
                    <span className="text-xs font-medium text-indigo-600">
                      Unread
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-neutral-800">{n.message}</p>
                <p className="mt-2 text-xs text-neutral-500">
                  {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                </p>
              </div>
              {!n.isRead && (
                <MarkNotificationReadControl
                  notificationId={n.id}
                  workspaceId={workspaceId}
                />
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
