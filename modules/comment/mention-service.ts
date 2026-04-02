import { auth } from '@/auth';
import { TenantContext } from '@/lib/tenant/tenant-context';
import { MentionRepository } from './mention-repository';
import { AuditService } from '@/modules/audit/service';
import { notifyTaskMention } from '@/modules/notification/service';
import { prisma } from '@/lib/db';

/**
 * Service for managing mentions with authorization and logging
 */
export class MentionService {
  private repository: MentionRepository;

  constructor(private tenantContext: TenantContext) {
    this.repository = new MentionRepository(tenantContext);
  }

  /**
   * Add mention and log action
   */
  async addMention(commentId: string, mentionedUserId: string) {
    const session = await auth();
    const currentUserId = session?.user?.id;

    if (!currentUserId) {
      throw new Error('Unauthorized');
    }

    // Don't mention yourself
    if (currentUserId === mentionedUserId) {
      return null;
    }

    const mention = await this.repository.addMention(commentId, mentionedUserId);

    // Log to audit
    await AuditService.log({
      workspaceId: this.tenantContext.workspaceId,
      userId: currentUserId,
      action: 'MENTION_ADDED',
      entityType: 'MENTION',
      entityId: mention.id,
      details: `User ${mentionedUserId} mentioned in comment ${commentId}`,
    });

    return mention;
  }

  /**
   * Remove mention
   */
  async removeMention(commentId: string, mentionedUserId: string) {
    const session = await auth();
    const currentUserId = session?.user?.id;

    if (!currentUserId) {
      throw new Error('Unauthorized');
    }

    await this.repository.removeMention(commentId, mentionedUserId);

    await AuditService.log({
      workspaceId: this.tenantContext.workspaceId,
      userId: currentUserId,
      action: 'MENTION_REMOVED',
      entityType: 'MENTION',
      entityId: `${commentId}-${mentionedUserId}`,
    });
  }

  /**
   * Get all mentions for a comment
   */
  async getCommentMentions(commentId: string) {
    return await this.repository.getCommentMentions(commentId);
  }

  /**
   * Create mentions from parsed list
   */
  async createMentions(commentId: string, mentionedUserIds: string[]) {
    const session = await auth();
    const currentUserId = session?.user?.id;

    if (!currentUserId) {
      throw new Error('Unauthorized');
    }

    const mentions = await this.repository.createMentions(commentId, mentionedUserIds);

    // Get comment details for notification
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { taskId: true, content: true },
    });

    // Log mentions and send notifications
    for (const mention of mentions) {
      if (mention.mentionedUserId !== currentUserId) {
        await AuditService.log({
          workspaceId: this.tenantContext.workspaceId,
          userId: currentUserId,
          action: 'MENTION_ADDED',
          entityType: 'MENTION',
          entityId: `mention-${mention.mentionedUserId}`,
          details: `User ${mention.mentionedUserId} mentioned in comment ${commentId}`,
        });

        // Send notification for mention
        if (comment) {
          await notifyTaskMention(
            this.tenantContext,
            comment.taskId,
            commentId,
            [mention.mentionedUserId],
            comment.content
          ).catch(err => console.error('[Comment] Failed to send mention notification:', err));
        }
      }
    }

    return mentions;
  }

  /**
   * Get mentions for a user
   */
  async getUserMentions(userId: string) {
    return await this.repository.getUserMentions(userId);
  }
}
