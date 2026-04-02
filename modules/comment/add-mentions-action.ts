'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { extractMentionedUsernames } from './mention-parser';
import { AuditService } from '@/modules/audit/service';

export async function addMentionsAction({
  commentId,
  commentText,
}: {
  commentId: string;
  commentText: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Get comment to find task and workspace
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        task: {
          select: { workspaceId: true },
        },
      },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    // Extract mentioned usernames from comment text
    const mentionedUsernames = extractMentionedUsernames(commentText);

    if (mentionedUsernames.length === 0) {
      return { success: true, added: [] };
    }

    // Find users by email or username in the workspace
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { email: { in: mentionedUsernames } },
              { name: { in: mentionedUsernames } },
            ],
          },
          {
            workspaceMembers: {
              some: {
                workspaceId: comment.task.workspaceId,
              },
            },
          },
        ],
      },
    });

    if (users.length === 0) {
      return { success: true, added: [] };
    }

    // Add mentions for each found user (skip self-mentions)
    const addedMentions = [];
    for (const user of users) {
      if (user.id === session.user.id) {
        continue; // Skip self-mentions
      }

      // Check if mention already exists
      const existingMention = await prisma.mention.findUnique({
        where: {
          commentId_mentionedUserId: {
            commentId,
            mentionedUserId: user.id,
          },
        },
      });

      if (existingMention) {
        continue; // Skip if already mentioned
      }

      // Create mention
      const mention = await prisma.mention.create({
        data: {
          commentId,
          mentionedUserId: user.id,
        },
      });

      addedMentions.push(mention);

      // Log to audit
      await AuditService.log({
        workspaceId: comment.task.workspaceId,
        userId: session.user.id,
        action: 'MENTION_ADDED',
        entityType: 'MENTION',
        entityId: mention.id,
        details: `User ${user.email} mentioned in comment ${commentId}`,
      });
    }

    return { success: true, added: addedMentions };
  } catch (error) {
    console.error('Error adding mentions:', error);
    // Don't throw - mentions are optional, comment was already created
    return { success: false, added: [], error: error instanceof Error ? error.message : 'Failed to add mentions' };
  }
}
