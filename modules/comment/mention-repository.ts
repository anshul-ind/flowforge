'use server';

import { prisma } from '@/lib/db';
import { TenantContext } from '@/lib/tenant/tenant-context';

/**
 * Repository for managing mentions in comments
 */
export class MentionRepository {
  constructor(private tenantContext: TenantContext) {}

  /**
   * Add a mention to a comment
   */
  async addMention(commentId: string, mentionedUserId: string) {
    return await prisma.commentMention.create({
      data: {
        commentId,
        mentionedUserId,
      },
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
  }

  /**
   * Remove a mention from a comment
   */
  async removeMention(commentId: string, mentionedUserId: string) {
    return await prisma.commentMention.deleteMany({
      where: {
        commentId,
        mentionedUserId,
      },
    });
  }

  /**
   * Get all mentions for a comment
   */
  async getCommentMentions(commentId: string) {
    return await prisma.commentMention.findMany({
      where: {
        commentId,
      },
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
  }

  /**
   * Get mentions for a user (to find all comments mentioning them)
   */
  async getUserMentions(userId: string) {
    return await prisma.commentMention.findMany({
      where: {
        mentionedUserId: userId,
      },
      include: {
        comment: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            task: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Check if a user is mentioned in a comment
   */
  async isMentioned(commentId: string, userId: string): Promise<boolean> {
    const mention = await prisma.commentMention.findFirst({
      where: {
        commentId,
        mentionedUserId: userId,
      },
    });
    return !!mention;
  }

  /**
   * Create mentions from parsed mention list
   */
  async createMentions(commentId: string, mentionedUserIds: string[]) {
    if (mentionedUserIds.length === 0) {
      return [];
    }

    // Remove duplicates
    const uniqueIds = Array.from(new Set(mentionedUserIds));

    // Create mentions (ignore if already exists)
    const mentions = await Promise.all(
      uniqueIds.map((userId) =>
        prisma.commentMention.create({
          data: {
            commentId,
            mentionedUserId: userId,
          },
          select: {
            mentionedUserId: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })
      )
    );

    return mentions;
  }
}
