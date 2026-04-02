import { TenantContext } from '@/lib/tenant/tenant-context';
import { ForbiddenError, NotFoundError } from '@/lib/errors/authorization';
import { sanitizeCommentBody } from '@/lib/input/sanitize';
import { CommentPolicy } from './policies';
import { CommentRepository } from './repository';
import { AuditService } from '@/modules/audit/service';

/**
 * Comment Service
 * 
 * Business logic for comment operations
 * Enforces authorization policies before data access
 */

export class CommentService {
  private repo: CommentRepository;

  constructor(private tenant: TenantContext) {
    this.repo = new CommentRepository(tenant);
  }

  /**
   * Get all comments for a task
   */
  async getTaskComments(taskId: string) {
    if (!CommentPolicy.canRead(this.tenant)) {
      throw new ForbiddenError('Cannot read comments');
    }

    return await this.repo.getTaskComments(taskId);
  }

  /**
   * Get a single comment
   */
  async getComment(commentId: string) {
    if (!CommentPolicy.canRead(this.tenant)) {
      throw new ForbiddenError('Cannot read comments');
    }

    const comment = await this.repo.getCommentWithUser(commentId);
    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    return comment;
  }

  /**
   * Create a comment on a task
   */
  async createComment(taskId: string, content: string) {
    if (!CommentPolicy.canCreate(this.tenant)) {
      throw new ForbiddenError('Cannot create comments');
    }

    // Sanitize comment content (allows safe HTML like bold, links, lists)
    const sanitizedContent = sanitizeCommentBody(content);
    
    const comment = await this.repo.createComment({ taskId, content: sanitizedContent });

    // Log to audit trail
    await AuditService.log({
      workspaceId: this.tenant.workspaceId,
      userId: this.tenant.userId,
      action: 'COMMENT_ADDED',
      entityType: 'COMMENT',
      entityId: comment.id,
      details: JSON.stringify({ taskId, contentLength: sanitizedContent.length }),
    });

    return comment;
  }

  /**
   * Update a comment (only author or manager/owner)
   */
  async updateComment(commentId: string, content: string) {
    const isAuthor = await this.repo.isAuthor(commentId, this.tenant.userId);

    if (!CommentPolicy.canUpdateOwn(this.tenant, isAuthor)) {
      throw new ForbiddenError('Cannot update this comment');
    }

    // Sanitize comment content (allows safe HTML like bold, links, lists)
    const sanitizedContent = sanitizeCommentBody(content);
    
    const comment = await this.repo.updateComment(commentId, sanitizedContent);

    // Log to audit trail
    await AuditService.log({
      workspaceId: this.tenant.workspaceId,
      userId: this.tenant.userId,
      action: 'COMMENT_ADDED',
      entityType: 'COMMENT',
      entityId: commentId,
      details: JSON.stringify({ action: 'EDITED', contentLength: sanitizedContent.length }),
    });

    return comment;
  }

  /**
   * Delete a comment (only author or manager/owner)
   */
  async deleteComment(commentId: string) {
    const isAuthor = await this.repo.isAuthor(commentId, this.tenant.userId);

    if (!CommentPolicy.canDelete(this.tenant, isAuthor)) {
      throw new ForbiddenError('Cannot delete this comment');
    }

    await this.repo.deleteComment(commentId);

    // Log to audit trail
    await AuditService.log({
      workspaceId: this.tenant.workspaceId,
      userId: this.tenant.userId,
      action: 'COMMENT_ADDED',
      entityType: 'COMMENT',
      entityId: commentId,
      details: JSON.stringify({ action: 'DELETED' }),
    });
  }
}
