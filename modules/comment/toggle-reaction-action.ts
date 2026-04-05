'use server';

import { auth } from '@/auth';
import { resolveTenantFromCommentId } from '@/modules/comment/resolve-tenant-from-comment';
import { ReactionService } from '@/modules/comment/reaction-service';
import { ActionResult } from '@/types/action-result';
import { ForbiddenError, NotFoundError } from '@/lib/errors/authorization';
import { z } from 'zod';

const toggleReactionSchema = z.object({
  commentId: z.string().min(1),
  emoji: z.string().min(1).max(2), // Emoji is typically 1-2 characters
});

/**
 * Toggle reaction on a comment
 * Returns true if reaction was added, false if removed
 */
export async function toggleReactionAction(
  input: unknown
): Promise<ActionResult<{ added: boolean }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'You must be logged in',
      };
    }

    const parsed = toggleReactionSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: 'Invalid reaction data',
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

    const service = new ReactionService(tenant);
    const added = await service.toggleReaction(
      parsed.data.commentId,
      parsed.data.emoji
    );

    return {
      success: true,
      message: added ? 'Reaction added' : 'Reaction removed',
      data: { added },
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

    console.error('Failed to toggle reaction:', error);
    return {
      success: false,
      message: 'Failed to toggle reaction',
    };
  }
}
