'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
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

    const workspaceMembership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!workspaceMembership) {
      return {
        success: false,
        message: 'Not a workspace member',
      };
    }

    const tenant = await resolveTenantContext(
      workspaceMembership.workspaceId,
      session.user.id
    );

    if (!tenant) {
      return {
        success: false,
        message: 'Cannot access workspace',
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
