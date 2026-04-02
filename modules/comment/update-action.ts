'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { updateCommentSchema } from '@/modules/comment/schemas';
import { CommentService } from '@/modules/comment/service';
import { ActionResult } from '@/types/action-result';
import { Comment } from '@/lib/generated/prisma';
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';

/**
 * Update a comment
 */
export async function updateCommentAction(input: unknown): Promise<ActionResult<Comment>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'You must be logged in',
      };
    }

    const parsed = updateCommentSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: 'Invalid comment data',
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
    const comment = await service.updateComment(parsed.data.commentId, parsed.data.content);

    return {
      success: true,
      message: 'Comment updated',
      data: comment,
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
      message: 'Failed to update comment',
    };
  }
}
