import type { NotificationType } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';

export type CreateNotificationInput = {
  userId: string;
  workspaceId: string;
  type: NotificationType;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
};

export async function createNotification(input: CreateNotificationInput) {
  try {
    return await prisma.notification.create({
      data: {
        userId: input.userId,
        workspaceId: input.workspaceId,
        type: input.type,
        message: input.message,
        isRead: false,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}
