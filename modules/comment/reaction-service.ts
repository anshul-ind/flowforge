import { TenantContext } from '@/lib/tenant/tenant-context';
import { ForbiddenError, NotFoundError } from '@/lib/errors/authorization';
import { ReactionRepository, ReactionGroup } from './reaction-repository';
import { AuditService } from '@/modules/audit/service';

/**
 * Reaction Service
 * 
 * Handles emoji reactions on comments
 */
export class ReactionService {
  private repo: ReactionRepository;

  constructor(private tenant: TenantContext) {
    this.repo = new ReactionRepository(tenant);
  }

  /**
   * Toggle reaction on a comment (add if not present, remove if present)
   */
  async toggleReaction(commentId: string, emoji: string): Promise<boolean> {
    // Any workspace member can react
    const added = await this.repo.toggleReaction(commentId, emoji);

    // Log to audit trail
    await AuditService.log({
      workspaceId: this.tenant.workspaceId,
      userId: this.tenant.userId,
      action: 'COMMENT_ADDED', // Reusing for now, could add REACTION_ADDED later
      entityType: 'REACTION',
      entityId: commentId,
      details: JSON.stringify({ 
        action: added ? 'REACTION_ADDED' : 'REACTION_REMOVED',
        emoji 
      }),
    });

    return added;
  }

  /**
   * Get all reactions for a comment
   */
  async getReactions(commentId: string): Promise<ReactionGroup[]> {
    return await this.repo.getReactions(commentId);
  }

  /**
   * Get reactions with user details for tooltips
   */
  async getReactionsWithUsers(
    commentId: string
  ): Promise<
    Array<{
      emoji: string;
      count: number;
      users: Array<{ id: string; name: string | null; email: string }>;
      hasUserReacted: boolean;
    }>
  > {
    return await this.repo.getReactionsWithUsers(commentId);
  }

  /**
   * Get user's own reactions for a comment
   */
  async getUserReactions(commentId: string): Promise<string[]> {
    return await this.repo.getUserReactions(commentId);
  }
}
