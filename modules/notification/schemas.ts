import { z } from 'zod';
import { NotificationType } from '@/lib/generated/prisma';

/**
 * Create Notification Input
 * Used internally by services to create notifications
 * Matches Prisma Notification model with NotificationType enum
 */
export const createNotificationSchema = z.object({
  userId: z.string().min(1, 'User ID required'),
  workspaceId: z.string().min(1, 'Workspace ID required'),
  type: z.enum([
    'TASK_ASSIGNED',
    'USER_MENTIONED',
    'APPROVAL_REQUESTED',
    'APPROVAL_APPROVED',
    'APPROVAL_REJECTED',
    'COMMENT_ADDED',
  ] as const),
  message: z.string().min(1).max(500),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

/**
 * List Notifications Query Params
 */
export const listNotificationsSchema = z.object({
  workspaceId: z.string().min(1),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  unreadOnly: z.boolean().optional(),
  type: z
    .enum([
      'TASK_ASSIGNED',
      'USER_MENTIONED',
      'APPROVAL_REQUESTED',
      'APPROVAL_APPROVED',
      'APPROVAL_REJECTED',
      'COMMENT_ADDED',
    ] as const)
    .optional(),
});

export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;

/**
 * Notification Preferences
 * User preferences for receiving notifications by type
 * Stored as JSON in WorkspaceMember.notificationPreferences
 */
export const notificationPreferencesSchema = z.object({
  workspaceId: z.string().min(1),
  taskAssigned: z.boolean().default(true),
  userMentioned: z.boolean().default(true),
  approvalRequested: z.boolean().default(true),
  approvalApproved: z.boolean().default(true),
  approvalRejected: z.boolean().default(true),
  commentAdded: z.boolean().default(true),
});

export type NotificationPreferencesInput = z.infer<
  typeof notificationPreferencesSchema
>;
