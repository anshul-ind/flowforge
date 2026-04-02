import { TenantContext } from '@/lib/tenant/tenant-context';
import { NotificationRepository } from './repository';
import {
  CreateNotificationInput,
  ListNotificationsInput,
} from './schemas';
import { prisma } from '@/lib/db';

/**
 * Notification Service
 * 
 * Handles notification creation, retrieval, and preference checking
 * Always called from other services (Task, Comment, Approval)
 */
export class NotificationService {
  private repo: NotificationRepository;

  constructor(private tenant: TenantContext) {
    this.repo = new NotificationRepository(tenant);
  }

  /**
   * Create notification
   * Always creates notification (preferences can be added later)
   */
  async createNotification(
    input: CreateNotificationInput
  ) {
    // Create the notification
    const notification = await this.repo.createNotification(input);

    console.log('[Notification] Created:', {
      userId: input.userId,
      type: input.type,
      messagePrefix: input.message.substring(0, 50),
    });

    return notification;
  }

  /**
   * List notifications for user
   */
  async listNotifications(input: ListNotificationsInput) {
    return await this.repo.listNotifications(input);
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(workspaceId: string) {
    return await this.repo.getUnreadCount(workspaceId);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    return await this.repo.markAsRead(notificationId);
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(workspaceId: string) {
    return await this.repo.markAllAsRead(workspaceId);
  }

  /**
   * Update notification preferences for user
   * (Preferences not yet stored in DB - placeholder for future enhancement)
   */
  async updatePreferences(
    workspaceId: string,
    preferences: Record<string, boolean>
  ) {
    // TODO: Implement when UserNotificationPreference table is added to Prisma
    console.log('[Notification] Preferences update requested:', preferences);
    return { success: true };
  }
}

/**
 * Helper function to notify when task is assigned
 * Usage: await notifyTaskAssignment(tenantContext, taskId, assigneeId, taskTitle)
 */
export async function notifyTaskAssignment(
  creatorTenant: TenantContext,
  taskId: string,
  assigneeId: string,
  taskTitle: string
) {
  const service = new NotificationService(creatorTenant);

  return await service.createNotification({
    userId: assigneeId,
    workspaceId: creatorTenant.workspaceId,
    type: 'TASK_ASSIGNED',
    message: `You were assigned task: "${taskTitle}"`,
  });
}

/**
 * Helper function to notify when user is mentioned in a comment
 * Usage: await notifyTaskMention(tenantContext, taskId, commentId, mentionedUserIds, commentBody)
 */
export async function notifyTaskMention(
  creatorTenant: TenantContext,
  taskId: string,
  commentId: string,
  mentionedUserIds: string[],
  commentBody: string
) {
  const service = new NotificationService(creatorTenant);

  // Create notification for each mentioned user
  return await Promise.all(
    mentionedUserIds
      .filter((id) => id !== creatorTenant.userId) // Don't notify self
      .map((userId) =>
        service.createNotification({
          userId,
          workspaceId: creatorTenant.workspaceId,
          type: 'USER_MENTIONED',
          message: `You were mentioned in a comment: "${commentBody.substring(0, 80).trim()}..."`,
        })
      )
  );
}

/**
 * Helper function to notify when approval is requested
 * Usage: await notifyApprovalRequested(tenantContext, approvalId, reviewerId, taskTitle, submitterName)
 */
export async function notifyApprovalRequested(
  creatorTenant: TenantContext,
  approvalId: string,
  reviewerId: string,
  taskTitle: string,
  submitterName: string | null
) {
  const service = new NotificationService(creatorTenant);

  return await service.createNotification({
    userId: reviewerId,
    workspaceId: creatorTenant.workspaceId,
    type: 'APPROVAL_REQUESTED',
    message: `Approval requested by ${submitterName || 'a team member'} for: "${taskTitle}"`,
  });
}

/**
 * Helper function to notify when approval is approved or rejected
 * Usage: await notifyApprovalDecided(tenantContext, approvalId, submitterId, taskTitle, decision, reviewerName)
 */
export async function notifyApprovalDecided(
  creatorTenant: TenantContext,
  approvalId: string,
  submitterId: string,
  taskTitle: string,
  decision: 'APPROVED' | 'REJECTED',
  reviewerName: string | null
) {
  const service = new NotificationService(creatorTenant);

  const messageMap = {
    APPROVED: `Your approval request was approved by ${reviewerName || 'a reviewer'} for: "${taskTitle}"`,
    REJECTED: `Your approval request was rejected by ${reviewerName || 'a reviewer'} for: "${taskTitle}"`,
  };

  return await service.createNotification({
    userId: submitterId,
    workspaceId: creatorTenant.workspaceId,
    type: decision === 'APPROVED' ? 'APPROVAL_APPROVED' : 'APPROVAL_REJECTED',
    message: messageMap[decision],
  });
}
