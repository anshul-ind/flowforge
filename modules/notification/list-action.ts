'use server';

import { requireUser } from '@/lib/auth/require-user';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { NotificationService } from './service';
import { successResult, errorResult, ActionResult } from '@/types/action-result';
import { prisma } from '@/lib/db';

/**
 * List notifications for current user
 */
export async function listNotificationsAction(
  workspaceId: string,
  params?: Partial<{
    limit: number;
    offset: number;
    unreadOnly: boolean;
    type: string;
  }>
): Promise<ActionResult<any>> {
  try {
    const user = await requireUser();
    const tenant = await resolveTenantContext(workspaceId, user.id);

    if (!tenant) {
      return errorResult('Workspace access denied');
    }

    const service = new NotificationService(tenant);
    const result = await service.listNotifications({
      workspaceId,
      limit: params?.limit ?? 20,
      offset: params?.offset ?? 0,
      unreadOnly: params?.unreadOnly,
      type: params?.type as any,
    });

    return successResult(result, 'Notifications loaded');
  } catch (error) {
    console.error('Error listing notifications:', error);
    return errorResult(
      error instanceof Error ? error.message : 'Failed to load notifications'
    );
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCountAction(
  workspaceId: string
): Promise<ActionResult<{ count: number }>> {
  try {
    const user = await requireUser();
    const tenant = await resolveTenantContext(workspaceId, user.id);

    if (!tenant) {
      return errorResult('Workspace access denied');
    }

    const service = new NotificationService(tenant);
    const count = await service.getUnreadCount(workspaceId);

    return successResult({ count }, 'Unread count retrieved');
  } catch (error) {
    console.error('Error getting unread count:', error);
    return errorResult('Failed to get unread count');
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationReadAction(
  notificationId: string,
  workspaceId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const tenant = await resolveTenantContext(workspaceId, user.id);

    if (!tenant) {
      return errorResult('Workspace access denied');
    }

    const result = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: user.id,
        workspaceId,
      },
      data: { isRead: true },
    });

    if (result.count === 0) {
      return errorResult('Notification not found');
    }

    return successResult({ id: notificationId }, 'Marked as read');
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return errorResult('Failed to mark as read');
  }
}

/**
 * Mark all notifications as read in workspace
 */
export async function markAllNotificationsReadAction(
  workspaceId: string
): Promise<ActionResult<{ count: number }>> {
  try {
    const user = await requireUser();
    const tenant = await resolveTenantContext(workspaceId, user.id);

    if (!tenant) {
      return errorResult('Workspace access denied');
    }

    const service = new NotificationService(tenant);
    const count = await service.markAllAsRead(workspaceId);

    return successResult({ count }, 'All notifications marked as read');
  } catch (error) {
    console.error('Error marking all as read:', error);
    return errorResult('Failed to mark all as read');
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferencesAction(
  workspaceId: string,
  preferences: Record<string, boolean>
): Promise<ActionResult<{ saved: boolean }>> {
  try {
    const user = await requireUser();
    const tenant = await resolveTenantContext(workspaceId, user.id);

    if (!tenant) {
      return errorResult('Workspace access denied');
    }

    const service = new NotificationService(tenant);
    await service.updatePreferences(workspaceId, preferences);

    return successResult(
      { saved: true },
      'Notification preferences updated'
    );
  } catch (error) {
    console.error('Error updating preferences:', error);
    return errorResult('Failed to update preferences');
  }
}
