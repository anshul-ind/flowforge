import { prisma } from '@/lib/db';
import { TenantContext } from '@/lib/tenant/tenant-context';
import {
  CreateNotificationInput,
  ListNotificationsInput,
} from './schemas';

/**
 * Notification Repository
 * 
 * Handles all database operations for notifications
 * Note: Prisma Notification model has fields: id, type, message, isRead, createdAt, workspaceId, userId
 */
export class NotificationRepository {
  constructor(private tenant: TenantContext) {}

  /**
   * Create a notification
   */
  async createNotification(input: CreateNotificationInput) {
    return await prisma.notification.create({
      data: {
        userId: input.userId,
        workspaceId: input.workspaceId,
        type: input.type,
        message: input.message,
        isRead: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get notifications for user with optional filters
   */
  async listNotifications(input: ListNotificationsInput) {
    const where: any = {
      workspaceId: input.workspaceId,
      userId: this.tenant.userId,
    };

    if (input.unreadOnly) {
      where.isRead = false;
    }

    if (input.type) {
      where.type = input.type;
    }

    // Get total count
    const total = await prisma.notification.count({ where });

    // Get paginated results
    // Important: older DBs may not yet have `entityType/entityId`.
    // Use `select` to avoid selecting non-existent columns.
    const notifications = await prisma.notification.findMany({
      where,
      select: {
        id: true,
        type: true,
        message: true,
        isRead: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: input.limit,
      skip: input.offset,
    });

    return {
      notifications,
      total,
      hasMore: input.offset + input.limit < total,
    };
  }

  /**
   * Get unread count for bell badge
   */
  async getUnreadCount(workspaceId: string) {
    return await prisma.notification.count({
      where: {
        workspaceId,
        userId: this.tenant.userId,
        isRead: false,
      },
    });
  }

  /**
   * Mark single notification as read
   */
  async markAsRead(notificationId: string) {
    return await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: this.tenant.userId,
        workspaceId: this.tenant.workspaceId,
      },
      data: {
        isRead: true,
      },
    });
  }

  /**
   * Mark all notifications as read for workspace
   */
  async markAllAsRead(workspaceId: string) {
    const result = await prisma.notification.updateMany({
      where: {
        workspaceId,
        userId: this.tenant.userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return result.count; // Return number of updated records
  }

  /**
   * Delete old notifications (keep last 100 per user per workspace)
   */
  async deleteOldNotifications(workspaceId: string, keepCount = 100) {
    // Get the last N notification IDs for this user/workspace (most recent)
    const notificationsToKeep = await prisma.notification.findMany({
      where: {
        workspaceId,
        userId: this.tenant.userId,
      },
      select: {
        id: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: keepCount,
    });

    const keepIds = notificationsToKeep.map((n) => n.id);

    // Delete everything else
    const result = await prisma.notification.deleteMany({
      where: {
        workspaceId,
        userId: this.tenant.userId,
        NOT: {
          id: {
            in: keepIds,
          },
        },
      },
    });

    return result.count;
  }
}
