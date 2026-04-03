import { prisma } from './db'

export {
  createNotification,
  type CreateNotificationInput,
} from './notifications/create-notification'
import { createNotification } from './notifications/create-notification'

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
) {
  try {
    return await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    })
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
    return null
  }
}

/**
 * Get unread notifications for user in workspace
 */
export async function getUnreadNotifications(userId: string, workspaceId: string) {
  try {
    return await prisma.notification.findMany({
      where: {
        userId,
        workspaceId,
        isRead: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return []
  }
}

/**
 * Get all notifications for user in workspace
 */
export async function getAllNotifications(userId: string, workspaceId: string) {
  try {
    return await prisma.notification.findMany({
      where: {
        userId,
        workspaceId,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return []
  }
}

/**
 * Notify task assignee when task is assigned
 */
export async function notifyTaskAssignment(
  assigneeId: string,
  workspaceId: string,
  taskTitle: string,
  taskId: string
) {
  return createNotification({
    userId: assigneeId,
    workspaceId,
    type: 'TASK_ASSIGNED',
    message: `You were assigned a new task: "${taskTitle}"`,
    entityType: 'task',
    entityId: taskId,
  })
}

/**
 * Notify reviewer when task is submitted for approval
 */
export async function notifyApprovalSubmission(
  reviewerId: string,
  workspaceId: string,
  taskTitle: string,
  approvalId: string
) {
  return createNotification({
    userId: reviewerId,
    workspaceId,
    type: 'TASK_SUBMITTED',
    message: `Task submitted for approval: "${taskTitle}"`,
    entityType: 'approval',
    entityId: approvalId,
  })
}

/**
 * Notify submitter when approval is approved
 */
export async function notifyApprovalApproved(
  submitterId: string,
  workspaceId: string,
  taskTitle: string,
  approvalId: string
) {
  return createNotification({
    userId: submitterId,
    workspaceId,
    type: 'APPROVAL_APPROVED',
    message: `Your task "${taskTitle}" was approved`,
    entityType: 'approval',
    entityId: approvalId,
  })
}

/**
 * Notify submitter when approval is rejected
 */
export async function notifyApprovalRejected(
  submitterId: string,
  workspaceId: string,
  taskTitle: string,
  rejectionReason: string,
  approvalId: string
) {
  return createNotification({
    userId: submitterId,
    workspaceId,
    type: 'APPROVAL_REJECTED',
    message: `Your task "${taskTitle}" was rejected: ${rejectionReason}`,
    entityType: 'approval',
    entityId: approvalId,
  })
}
