'use server';

import { auth } from '@/auth';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { ReactionService } from './reaction-service';

/**
 * Fetch reactions for a comment
 */
export async function getReactionsAction(
  workspaceId: string,
  commentId: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      message: 'Unauthorized',
    };
  }

  try {
    const tenantContext = await resolveTenantContext(
      workspaceId,
      session.user.id
    );
    if (!tenantContext) {
      return {
        success: false,
        message: 'Tenant context not found',
      };
    }

    const reactionService = new ReactionService(tenantContext);
    const reactions = await reactionService.getReactions(commentId);

    return {
      success: true,
      data: reactions,
    };
  } catch (error) {
    console.error('Failed to get reactions:', error);
    return {
      success: false,
      message: 'Failed to load reactions',
    };
  }
}
