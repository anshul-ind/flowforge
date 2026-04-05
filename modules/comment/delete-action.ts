'use server';

import { auth } from '@/auth';
import { resolveTenantFromCommentId } from '@/modules/comment/resolve-tenant-from-comment';
import { deleteCommentSchema } from '@/modules/comment/schemas';
import { CommentService } from '@/modules/comment/service';
import { ActionResult } from '@/types/action-result';
import { ForbiddenError, NotFoundError } from '@/lib/errors';

/**
 * Delete a comment
 */
export async function deleteCommentAction(input: unknown): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'You must be logged in',
      };
    }

    const parsed = deleteCommentSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: 'Invalid input',
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const tenant = await resolveTenantFromCommentId(
      session.user.id,
      parsed.data.commentId
    );

    if (!tenant) {
      return {
        success: false,
        message: 'Comment not found or workspace access denied',
      };
    }

    const service = new CommentService(tenant);
    await service.deleteComment(parsed.data.commentId);

    return {
      success: true,
      message: 'Comment deleted',
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        success: false,
        message: error.message,
      };
    }

    if (error instanceof NotFoundError) {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: false,
      message: 'Failed to delete comment',
    };
  }
}
