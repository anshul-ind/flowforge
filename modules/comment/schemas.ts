import { z } from 'zod';

/**
 * Comment Schemas
 * Zod validation for comment operations
 */

export const createCommentSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace is required'),
  taskId: z.string().min(1, 'Task ID is required'),
  content: z.string().min(1, 'Comment cannot be empty').max(5000, 'Comment must be 5000 characters or less'),
});

export const updateCommentSchema = z.object({
  commentId: z.string().min(1, 'Comment ID is required'),
  content: z.string().min(1, 'Comment cannot be empty').max(5000, 'Comment must be 5000 characters or less'),
});

export const deleteCommentSchema = z.object({
  commentId: z.string().min(1, 'Comment ID is required'),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>;
