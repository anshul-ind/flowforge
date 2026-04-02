import { prisma } from '@/lib/db';
import { TenantContext } from '@/lib/tenant/tenant-context';
import { CommentReaction } from '@/lib/generated/prisma';

export interface ReactionGroup {
  emoji: string;
  count: number;
  userIds: string[];
  hasUserReacted: boolean;
}

/**
 * Comment Reaction Repository
 * 
 * Data access layer for comment reactions
 */
export class ReactionRepository {
  constructor(private tenant: TenantContext) {}

  /**
   * Add a reaction to a comment
   * If user already reacted with same emoji, does nothing
   */
  async addReaction(
    commentId: string,
    emoji: string
  ): Promise<CommentReaction | null> {
    // Verify comment exists in workspace
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        workspaceId: this.tenant.workspaceId,
      },
    });

    if (!comment) {
      return null;
    }

    try {
      return await prisma.commentReaction.create({
        data: {
          commentId,
          userId: this.tenant.userId,
          emoji,
        },
      });
    } catch (error: any) {
      // Handle unique constraint violation (user already reacted with this emoji)
      if (error.code === 'P2002') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Remove a reaction from a comment
   */
  async removeReaction(commentId: string, emoji: string): Promise<boolean> {
    const result = await prisma.commentReaction.deleteMany({
      where: {
        commentId,
        userId: this.tenant.userId,
        emoji,
      },
    });

    return result.count > 0;
  }

  /**
   * Toggle reaction: remove if exists, add if not
   */
  async toggleReaction(commentId: string, emoji: string): Promise<boolean> {
    // Check if user already has this reaction
    const existing = await prisma.commentReaction.findUnique({
      where: {
        commentId_userId_emoji: {
          commentId,
          userId: this.tenant.userId,
          emoji,
        },
      },
    });

    if (existing) {
      // Remove reaction
      await this.removeReaction(commentId, emoji);
      return false; // Now removed
    } else {
      // Add reaction
      await this.addReaction(commentId, emoji);
      return true; // Now added
    }
  }

  /**
   * Get all reactions for a comment, grouped by emoji
   */
  async getReactions(commentId: string): Promise<ReactionGroup[]> {
    const reactions = await prisma.commentReaction.findMany({
      where: { commentId },
      select: {
        emoji: true,
        userId: true,
      },
    });

    // Group by emoji
    const grouped = new Map<string, Set<string>>();
    reactions.forEach(({ emoji, userId }) => {
      if (!grouped.has(emoji)) {
        grouped.set(emoji, new Set());
      }
      grouped.get(emoji)!.add(userId);
    });

    // Convert to ReactionGroup format
    const groups: ReactionGroup[] = Array.from(grouped).map(([emoji, userIds]) => ({
      emoji,
      count: userIds.size,
      userIds: Array.from(userIds),
      hasUserReacted: userIds.has(this.tenant.userId),
    }));

    return groups.sort((a, b) => b.count - a.count);
  }

  /**
   * Get all reactions for a comment with user details
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
    const reactions = await prisma.commentReaction.findMany({
      where: { commentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Group by emoji
    const grouped = new Map<
      string,
      { users: Array<{ id: string; name: string | null; email: string }>; userIds: Set<string> }
    >();

    reactions.forEach(({ emoji, user, userId }) => {
      if (!grouped.has(emoji)) {
        grouped.set(emoji, { users: [], userIds: new Set() });
      }
      grouped.get(emoji)!.users.push(user);
      grouped.get(emoji)!.userIds.add(userId);
    });

    // Convert to format with user details
    const groups = Array.from(grouped).map(([emoji, { users, userIds }]) => ({
      emoji,
      count: users.length,
      users,
      hasUserReacted: userIds.has(this.tenant.userId),
    }));

    return groups.sort((a, b) => b.count - a.count);
  }

  /**
   * Get user's reactions for a comment
   */
  async getUserReactions(commentId: string): Promise<string[]> {
    const reactions = await prisma.commentReaction.findMany({
      where: {
        commentId,
        userId: this.tenant.userId,
      },
      select: { emoji: true },
    });

    return reactions.map((r) => r.emoji);
  }
}
