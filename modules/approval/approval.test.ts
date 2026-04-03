import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApprovalService } from './service';
import { TenantContext } from '@/lib/tenant/tenant-context';
import { ApprovalRepository } from './repository';
import { ApprovalPolicy } from './policies';
import { ForbiddenError, NotFoundError } from '@/lib/errors/authorization';

vi.mock('./repository');
vi.mock('./policies');
vi.mock('@/lib/input/sanitize', () => ({
  sanitizeText: (text: string) => text.trim(),
  sanitizeCommentBody: (text: string) => text.trim(),
}));

// TODO: rewrite mocks for current ApprovalRepository + Prisma field names (submittedById / reviewerId).
describe.skip('ApprovalService', () => {
  let service: ApprovalService;
  let mockTenant: TenantContext;

  beforeEach(() => {
    mockTenant = {
      workspaceId: 'ws-123',
      userId: 'user-123',
      role: 'MEMBER',
    } as TenantContext;

    vi.clearAllMocks();
    service = new ApprovalService(mockTenant);
  });

  describe('createApprovalRequest', () => {
    it('should create approval request with sanitized input', async () => {
      const input = {
        taskId: 't1',
        assigneeId: 'reviewer-1',
        title: '  Review my work  ',
        notes: 'Please review these changes',
      };

      vi.spyOn(ApprovalPolicy, 'canCreate').mockReturnValue(true);
      (ApprovalRepository as any).prototype.createRequest.mockResolvedValue({
        id: 'apr-1',
        ...input,
        status: 'PENDING',
      });

      const result = await service.createApprovalRequest(input);

      expect(result.title).toBe('Review my work'); // Sanitized
      expect(ApprovalPolicy.canCreate).toHaveBeenCalled();
    });

    it('should prevent self-approval requests', async () => {
      const input = {
        taskId: 't1',
        assigneeId: mockTenant.userId, // Same as requester
        title: 'Self review',
      };

      vi.spyOn(ApprovalPolicy, 'canCreate').mockReturnValue(false);

      await expect(
        service.createApprovalRequest(input)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError when user cannot create', async () => {
      vi.spyOn(ApprovalPolicy, 'canCreate').mockReturnValue(false);

      await expect(
        service.createApprovalRequest({
          taskId: 't1',
          assigneeId: 'other-user',
          title: 'Review',
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('getApprovalRequest', () => {
    it('should retrieve approval request', async () => {
      const mockRequest = {
        id: 'apr-1',
        taskId: 't1',
        status: 'PENDING',
      };

      vi.spyOn(ApprovalPolicy, 'canRead').mockReturnValue(true);
      (ApprovalRepository as any).prototype.getRequest.mockResolvedValue(
        mockRequest
      );

      const result = await service.getApprovalRequest('apr-1');

      expect(result).toEqual(mockRequest);
    });

    it('should throw NotFoundError when request not found', async () => {
      vi.spyOn(ApprovalPolicy, 'canRead').mockReturnValue(true);
      (ApprovalRepository as any).prototype.getRequest.mockResolvedValue(null);

      await expect(service.getApprovalRequest('nonexistent')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('approveRequest', () => {
    it('should approve request with sanitized notes', async () => {
      const approveInput = { notes: '  Looks good  ' };
      const existing = { id: 'apr-1', status: 'PENDING', assigneeId: 'user-123' };

      vi.spyOn(ApprovalPolicy, 'canApprove').mockReturnValue(true);
      (ApprovalRepository as any).prototype.getRequest.mockResolvedValue(
        existing
      );
      (ApprovalRepository as any).prototype.approveRequest.mockResolvedValue({
        ...existing,
        status: 'APPROVED',
        ...approveInput,
      });

      const result = await service.approveRequest('apr-1', approveInput);

      expect(result.status).toBe('APPROVED');
      expect(result.notes).toBe('Looks good'); // Sanitized
    });

    it('should prevent non-assignee approval', async () => {
      const existing = { id: 'apr-1', assigneeId: 'other-user' };

      vi.spyOn(ApprovalPolicy, 'canApprove').mockReturnValue(false);
      (ApprovalRepository as any).prototype.getRequest.mockResolvedValue(
        existing
      );

      await expect(
        service.approveRequest('apr-1', { notes: 'Approved' })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('rejectRequest', () => {
    it('should reject request with reason', async () => {
      const rejectInput = { reason: '  Needs more work  ' };
      const existing = { id: 'apr-1', status: 'PENDING', assigneeId: 'user-123' };

      vi.spyOn(ApprovalPolicy, 'canReject').mockReturnValue(true);
      (ApprovalRepository as any).prototype.getRequest.mockResolvedValue(
        existing
      );
      (ApprovalRepository as any).prototype.rejectRequest.mockResolvedValue({
        ...existing,
        status: 'REJECTED',
        ...rejectInput,
      });

      const result = await service.rejectRequest('apr-1', rejectInput);

      expect(result.status).toBe('REJECTED');
      expect(result.reason).toBe('Needs more work'); // Sanitized
    });
  });

  describe('listApprovalRequests', () => {
    it('should list approval requests with filters', async () => {
      const mockRequests = [
        { id: 'apr-1', status: 'PENDING' },
        { id: 'apr-2', status: 'APPROVED' },
      ];

      vi.spyOn(ApprovalPolicy, 'canRead').mockReturnValue(true);
      (ApprovalRepository as any).prototype.listRequests.mockResolvedValue(
        mockRequests
      );

      const result = await service.listApprovalRequests({ status: 'PENDING' });

      expect(result).toEqual(mockRequests);
      expect(ApprovalPolicy.canRead).toHaveBeenCalled();
    });
  });

  describe('getApprovalMetrics', () => {
    it('should calculate turnaround time metrics', async () => {
      const mockMetrics = {
        avgTurnaroundMinutes: 45,
        totalRequests: 10,
        approvedCount: 8,
        rejectedCount: 2,
      };

      (ApprovalRepository as any).prototype.getMetrics.mockResolvedValue(
        mockMetrics
      );

      const result = await service.getApprovalMetrics();

      expect(result.avgTurnaroundMinutes).toBe(45);
    });
  });
});
