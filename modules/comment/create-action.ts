'use server';

import { auth } from '@/auth';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { createCommentSchema } from '@/modules/comment/schemas';
import { CommentService } from '@/modules/comment/service';
import { commentLimiter } from '@/lib/rate-limiting/rate-limiter';
import { ActionResult } from '@/types/action-result';
import { Comment } from '@/lib/generated/prisma';
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';

/**
 * Create a comment on a task
 * 
 * Server Action
 * 
 * Flow:
 * 1. Get authenticated user
 * 2. Validate input (taskId, content)
 * 3. Resolve tenant context
 * 4. Create comment via service (handles auth & audit logging)
 * 5. Return success or error
 */
export async function createCommentAction(input: unknown): Promise<ActionResult<Comment>> {
  try {
    // Get session
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'You must be logged in to comment',
      };
    }

    // Rate limiting: 60 comments per user per hour
    const limitResult = commentLimiter.check(session.user.id);
    if (!limitResult.allowed) {
      return {
        success: false,
        message: 'Too many comment requests. Please try again later.',
      };
    }

    // Validate input
    const parsed = createCommentSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: 'Invalid comment data',
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const tenant = await resolveTenantContext(
      parsed.data.workspaceId,
      session.user.id
    );

    if (!tenant) {
      return {
        success: false,
        message: 'Cannot access this workspace',
      };
    }

    // Create comment
    const service = new CommentService(tenant);
    const comment = await service.createComment(parsed.data.taskId, parsed.data.content);

    return {
      success: true,
      message: 'Comment created',
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

    if (error instanceof ValidationError) {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: false,
      message: 'Failed to create comment',
    };
  }
}
