'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export type MarkNotificationReadState = null | { ok: false; error: string } | { ok: true }

export async function markNotificationReadFormAction(
  _prev: MarkNotificationReadState,
  formData: FormData
): Promise<MarkNotificationReadState> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Unauthorized' }
  }

  const notificationId = formData.get('notificationId')
  const workspaceId = formData.get('workspaceId')

  if (typeof notificationId !== 'string' || !notificationId) {
    return { ok: false, error: 'Missing notification' }
  }

  if (typeof workspaceId !== 'string' || !workspaceId.trim()) {
    return { ok: false, error: 'Missing workspace' }
  }

  const where = {
    id: notificationId,
    userId: session.user.id,
    workspaceId,
  }

  const result = await prisma.notification.updateMany({
    where,
    data: { isRead: true },
  })

  if (result.count === 0) {
    return { ok: false, error: 'Notification not found' }
  }

  revalidatePath(`/workspace/${workspaceId}/notifications`)

  return { ok: true }
}

/**
 * Programmatic mark-as-read (same rules as form action).
 */
export async function markNotificationReadForUser(
  notificationId: string,
  userId: string,
  workspaceId: string
) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
      workspaceId,
    },
    data: { isRead: true },
  })
}
