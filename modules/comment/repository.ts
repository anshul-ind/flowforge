import { prisma } from '@/lib/db';
import { TenantContext } from '@/lib/tenant/tenant-context';
import { Comment } from '@/lib/generated/prisma';

/**
 * Comment Repository
 * 
 * Data access layer for comments
 * Scoped to workspace via tenant context
 */

export class CommentRepository {
  constructor(private tenant: TenantContext) {}

  /**
   * Get all comments for a task (excludes deleted)
   * Includes author details
   */
  async getTaskComments(taskId: string): Promise<
    (Comment & { author: { id: string; name: string | null; email: string } })[]
  > {
    return await prisma.comment.findMany({
      where: {
        taskId,
        workspaceId: this.tenant.workspaceId,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Get a single comment by ID
   */
  async getComment(commentId: string): Promise<Comment | null> {
    return await prisma.comment.findFirst({
      where: {
        id: commentId,
        workspaceId: this.tenant.workspaceId,
      },
    });
  }

  /**
   * Get comment with user details (excludes deleted)
   */
  async getCommentWithUser(commentId: string): Promise<
    (Comment & { author: { id: string; name: string | null; email: string } }) | null
  > {
    return await prisma.comment.findFirst({
      where: {
        id: commentId,
        workspaceId: this.tenant.workspaceId,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Create a new comment
   */
  async createComment(data: { taskId: string; content: string }): Promise<Comment> {
    // Verify task exists in workspace
    const task = await prisma.task.findFirst({
      where: {
        id: data.taskId,
        workspaceId: this.tenant.workspaceId,
      },
      select: { id: true, projectId: true },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    return await prisma.comment.create({
      data: {
        taskId: data.taskId,
        body: data.content,
        authorId: this.tenant.userId,
        workspaceId: this.tenant.workspaceId,
        projectId: task.projectId,
      },
    });
  }

  /**
   * Update comment content
   */
  async updateComment(commentId: string, content: string): Promise<Comment> {
    const comment = await this.getComment(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    return await prisma.comment.update({
      where: { id: commentId },
      data: {
        body: content,
      },
    });
  }

  /**
   * Soft delete a comment (mark as deleted, don't remove data)
   */
  async deleteComment(commentId: string): Promise<Comment> {
    const comment = await this.getComment(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    return await prisma.comment.delete({
      where: { id: commentId },
    });
  }

  /**
   * Check if user is comment author
   */
  async isAuthor(commentId: string, userId: string): Promise<boolean> {
    const comment = await this.getComment(commentId);
    if (!comment) return false;
    return comment.authorId === userId;
  }
}
