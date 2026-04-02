import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommentService } from './service';
import { TenantContext } from '@/lib/tenant/tenant-context';
import { CommentRepository } from './repository';
import { CommentPolicy } from './policies';
import { ForbiddenError, NotFoundError } from '@/lib/errors/authorization';

vi.mock('./repository');
vi.mock('./policies');
vi.mock('@/lib/input/sanitize', () => ({
  sanitizeCommentBody: (text: string) => text.trim(),
}));

describe('CommentService', () => {
  let service: CommentService;
  let mockTenant: TenantContext;

  beforeEach(() => {
    mockTenant = {
      workspaceId: 'ws-123',
      userId: 'user-123',
      role: 'MEMBER',
    } as TenantContext;

    vi.clearAllMocks();
    service = new CommentService(mockTenant);
  });

  describe('listComments', () => {
    it('should list comments for task', async () => {
      const mockComments = [
        { id: 'c1', content: 'Comment 1', authorId: 'u1' },
        { id: 'c2', content: 'Comment 2', authorId: 'u2' },
      ];

      vi.spyOn(CommentPolicy, 'canRead').mockReturnValue(true);
      (CommentRepository as any).prototype.listComments.mockResolvedValue(
        mockComments
      );

      const result = await service.listComments('t1');

      expect(result).toEqual(mockComments);
      expect(CommentPolicy.canRead).toHaveBeenCalled();
    });

    it('should throw ForbiddenError when user cannot read', async () => {
      vi.spyOn(CommentPolicy, 'canRead').mockReturnValue(false);

      await expect(service.listComments('t1')).rejects.toThrow(ForbiddenError);
    });
  });

  describe('createComment', () => {
    it('should create comment with sanitized HTML content', async () => {
      const input = {
        taskId: 't1',
        content: '  <b>Bold text</b>  ',
        htmlContent: '<b>Bold text</b>',
      };

      vi.spyOn(CommentPolicy, 'canCreate').mockReturnValue(true);
      (CommentRepository as any).prototype.createComment.mockResolvedValue({
        id: 'c1',
        ...input,
        authorId: mockTenant.userId,
      });

      const result = await service.createComment(input);

      expect(result.content).toBe('<b>Bold text</b>'); // Sanitized
      expect(CommentPolicy.canCreate).toHaveBeenCalled();
    });

    it('should throw ForbiddenError when user cannot create', async () => {
      vi.spyOn(CommentPolicy, 'canCreate').mockReturnValue(false);

      await expect(
        service.createComment({ taskId: 't1', content: 'Comment' })
      ).rejects.toThrow(ForbiddenError);
    });

    it('should block script injection attempts', async () => {
      const maliciousInput = {
        taskId: 't1',
        content: '<script>alert("xss")</script>',
        htmlContent: '<script>alert("xss")</script>',
      };

      vi.spyOn(CommentPolicy, 'canCreate').mockReturnValue(true);
      (CommentRepository as any).prototype.createComment.mockResolvedValue({
        id: 'c1',
        ...maliciousInput,
      });

      const result = await service.createComment(maliciousInput);

      // Sanitizer should remove script tags
      expect(result.content).not.toContain('<script>');
    });
  });

  describe('updateComment', () => {
    it('should update own comment', async () => {
      const existing = { id: 'c1', content: 'Original', authorId: 'user-123' };
      const update = { content: '  Updated comment  ' };

      vi.spyOn(CommentPolicy, 'canUpdate').mockReturnValue(true);
      (CommentRepository as any).prototype.getComment.mockResolvedValue(
        existing
      );
      (CommentRepository as any).prototype.updateComment.mockResolvedValue({
        ...existing,
        ...update,
      });

      const result = await service.updateComment('c1', update);

      expect(result.content).toBe('Updated comment');
      expect(CommentPolicy.canUpdate).toHaveBeenCalled();
    });

    it('should prevent updating others comments', async () => {
      const existing = { id: 'c1', authorId: 'other-user' };

      vi.spyOn(CommentPolicy, 'canUpdate').mockReturnValue(false);
      (CommentRepository as any).prototype.getComment.mockResolvedValue(
        existing
      );

      await expect(
        service.updateComment('c1', { content: 'Hacked' })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('deleteComment', () => {
    it('should delete comment with authorization', async () => {
      vi.spyOn(CommentPolicy, 'canDelete').mockReturnValue(true);
      (CommentRepository as any).prototype.getComment.mockResolvedValue({
        id: 'c1',
      });
      (CommentRepository as any).prototype.deleteComment.mockResolvedValue({
        id: 'c1',
        deleted: true,
      });

      const result = await service.deleteComment('c1');

      expect(CommentPolicy.canDelete).toHaveBeenCalled();
    });
  });
});
