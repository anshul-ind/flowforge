import { z } from 'zod';

/**
 * Approval Request Schemas
 * 
 * Zod schemas for approval request validation
 */

export const createApprovalSchema = z.object({
  taskId: z.string().min(1, 'Task is required'),
  reviewerId: z.string().min(1, 'Reviewer is required'),
  note: z.string().max(1000, 'Note must be less than 1000 characters').optional(),
});

export type CreateApprovalInput = z.infer<typeof createApprovalSchema>;

export const approveApprovalSchema = z.object({
  approvalId: z.string().min(1, 'Approval ID is required'),
});

export type ApproveApprovalInput = z.infer<typeof approveApprovalSchema>;

export const rejectApprovalSchema = z.object({
  approvalId: z.string().min(1, 'Approval ID is required'),
  reason: z.string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(1000, 'Rejection reason must be less than 1000 characters'),
});

export type RejectApprovalInput = z.infer<typeof rejectApprovalSchema>;

export const cancelApprovalSchema = z.object({
  approvalId: z.string().min(1, 'Approval ID is required'),
});

export type CancelApprovalInput = z.infer<typeof cancelApprovalSchema>;
