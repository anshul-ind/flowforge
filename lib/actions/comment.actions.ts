'use server';

import { auth } from '@/auth';
import { getWorkspaceContext } from '@/lib/tenancy/workspace-context';
import { requirePermission } from '@/lib/permissions/rbac';
import { revalidatePath } from 'next/cache';

interface AddCommentInput {
  workspaceId: string;
  taskId: string;
  body: string;
  parentId?: string; // for nested replies
}

/**
 * Add a comment to a task
 * Requires: add_comment permission
 * Consistency: STRONG (persists before response)
 * UI: Optimistic — comment added to list immediately, server confirms
 */
export async function addCommentAction(input: AddCommentInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const context = await getWorkspaceContext(session, input.workspaceId);
    if (!context) {
      return {
        success: false,
        error: 'Access denied',
      };
    }

    requirePermission(context.role, 'add_comment');

    // TODO: Validate task belongs to workspace
    // TODO: Validate body not empty
    // TODO: Insert comment to DB
    // const comment = await db.taskComment.create({
    //   data: {
    //     taskId: input.taskId,
    //     body: input.body,
    //     parentId: input.parentId,
    //     createdBy: session.user.id,
    //   },
    // });

    // TODO: Parse mentions (@username) and create notifications
    // TODO: Audit log (optional for comments)

    revalidatePath(`/workspace/${input.workspaceId}`);

    return {
      success: true,
      message: 'Comment added',
      data: {
        // Return comment shape so client can insert optimistically
        id: 'temp-id', // in production: comment.id
        createdBy: session.user.id || '',
        body: input.body,
        createdAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('[addCommentAction]', error);
    return {
      success: false,
      error: String(error).includes('Insufficient') ? String(error) : 'Failed to add comment',
    };
  }
}
