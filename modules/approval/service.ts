import { TenantContext } from '@/lib/tenant/tenant-context';
import { ForbiddenError, NotFoundError } from '@/lib/errors/authorization';
import { sanitizeText, sanitizeCommentBody } from '@/lib/input/sanitize';
import { ApprovalPolicy } from './policies';
import { ApprovalRepository } from './repository';
import { ApprovalRequest, ApprovalStatus } from '@/lib/generated/prisma';
import { notifyApprovalRequested, notifyApprovalDecided } from '@/modules/notification/service';
import { prisma } from '@/lib/db';

/**
 * Approval Service
 * 
 * Handles approval/review workflow with authorization checks.
 * 
 * Key points:
 * - Any workspace member can request approval
 * - Only assigned approver or OWNER/MANAGER can approve
 * - OWNER/MANAGER can reject
 * - VIEWER cannot participate in approval workflow
 */
export class ApprovalService {
  private repo: ApprovalRepository;

  constructor(private tenant: TenantContext) {
    this.repo = new ApprovalRepository(tenant);
  }

  /**
   * Get approval request by ID
   * All workspace members can read
   */
  async getApproval(approvalId: string): Promise<ApprovalRequest> {
    if (!ApprovalPolicy.canRead(this.tenant)) {
      throw new ForbiddenError('Cannot read approvals');
    }

    const approval = await this.repo.getApproval(approvalId);
    if (!approval) {
      throw new NotFoundError('Approval request not found');
    }

    return approval;
  }

  /**
   * List all approvals in workspace
   * Can filter by status or assignee
   */
  async listApprovals(filters?: { status?: ApprovalStatus }): Promise<ApprovalRequest[]> {
    if (!ApprovalPolicy.canRead(this.tenant)) {
      throw new ForbiddenError('Cannot read approvals');
    }

    return await this.repo.listApprovals(filters);
  }

  /**
   * Get approvals pending for current user
   */
  async listMyPendingApprovals(): Promise<ApprovalRequest[]> {
    if (!ApprovalPolicy.canRead(this.tenant)) {
      throw new ForbiddenError('Cannot read approvals');
    }

    return await this.repo.listPendingForUser(this.tenant.userId);
  }

  /**
   * Get approvals I requested
   */
  async listMyRequests(): Promise<ApprovalRequest[]> {
    if (!ApprovalPolicy.canRead(this.tenant)) {
      throw new ForbiddenError('Cannot read approvals');
    }

    return await this.repo.listRequestedByUser(this.tenant.userId);
  }

  /**
   * Create approval request
   * OWNER, MANAGER, MEMBER can request (VIEWER cannot)
   */
  async createApprovalRequest(data: {
    taskId: string;
    approverId: string;
    title: string;
    notes?: string;
  }): Promise<ApprovalRequest> {
    if (!ApprovalPolicy.canCreate(this.tenant)) {
      throw new ForbiddenError('Cannot create approval requests');
    }

    // Prevent self-approval (shouldn't normally happen, but good safeguard)
    if (data.approverId === this.tenant.userId) {
      throw new Error('Cannot request approval from yourself');
    }

    // Sanitize input
    const sanitizedData = {
      taskId: data.taskId,
      approverId: data.approverId,
      title: sanitizeText(data.title),
      notes: data.notes ? sanitizeCommentBody(data.notes) : undefined,
    };

    const approval = await this.repo.createApproval(sanitizedData);
    if (!approval) {
      throw new NotFoundError('Cannot create approval - task or approver invalid');
    }

    // Get requester info for notification
    const requester = await prisma.user.findUnique({
      where: { id: approval.requesterId },
      select: { name: true },
    });

    // Notify the approver
    await notifyApprovalRequested(
      this.tenant,
      approval.id,
      data.approverId,
      data.title,
      requester?.name || 'A team member'
    ).catch(err => console.error('[Approval] Failed to send approval request notification:', err));

    return approval;
  }

  /**
   * Approve a request
   * Only the assigned approver can approve
   * Exception: OWNER/MANAGER can approve any request
   */
  async approveRequest(approvalId: string): Promise<ApprovalRequest> {
    if (!ApprovalPolicy.canApprove(this.tenant)) {
      throw new ForbiddenError('Cannot approve requests');
    }

    const approval = await this.getApproval(approvalId);

    // Check if current user is the assigned approver
    // Or if they're OWNER/MANAGER (can approve on anyone's behalf)
    const isAssignedApprover = approval.approverId === this.tenant.userId;
    const isOwnerOrManager = this.tenant.role === 'OWNER' || this.tenant.role === 'MANAGER';

    if (!isAssignedApprover && !isOwnerOrManager) {
      throw new ForbiddenError('You are not the assigned approver');
    }

    if (approval.status !== 'PENDING') {
      throw new Error('Can only approve pending requests');
    }

    const updated = await this.repo.approveRequest(approvalId);
    if (!updated) {
      throw new NotFoundError('Approval request not found');
    }

    // Get approver info for notification
    const approver = await prisma.user.findUnique({
      where: { id: this.tenant.userId },
      select: { name: true },
    });

    // Notify the requester that their approval was approved
    await notifyApprovalDecided(
      this.tenant,
      approvalId,
      approval.requesterId,
      approval.title,
      'APPROVED',
      approver?.name || 'A reviewer'
    ).catch(err => console.error('[Approval] Failed to send approval decision notification:', err));

    return updated;
  }

  /**
   * Reject a request
   * OWNER and MANAGER can reject
   */
  async rejectRequest(approvalId: string): Promise<ApprovalRequest> {
    if (!ApprovalPolicy.canReject(this.tenant)) {
      throw new ForbiddenError('Cannot reject requests');
    }

    const approval = await this.getApproval(approvalId);

    if (approval.status !== 'PENDING') {
      throw new Error('Can only reject pending requests');
    }

    const updated = await this.repo.rejectRequest(approvalId);
    if (!updated) {
      throw new NotFoundError('Approval request not found');
    }

    // Get approver info for notification
    const approver = await prisma.user.findUnique({
      where: { id: this.tenant.userId },
      select: { name: true },
    });

    // Notify the requester that their approval was rejected
    await notifyApprovalDecided(
      this.tenant,
      approvalId,
      approval.requesterId,
      approval.title,
      'REJECTED',
      approver?.name || 'A reviewer'
    ).catch(err => console.error('[Approval] Failed to send approval decision notification:', err));

    return updated;
  }

  /**
   * Cancel a pending request
   * Requester or OWNER/MANAGER can cancel
   */
  async cancelRequest(approvalId: string): Promise<ApprovalRequest> {
    const approval = await this.getApproval(approvalId);

    // Check if current user is the requester or OWNER/MANAGER
    const isRequester = approval.requesterId === this.tenant.userId;
    const isOwnerOrManager = this.tenant.role === 'OWNER' || this.tenant.role === 'MANAGER';

    if (!isRequester && !isOwnerOrManager) {
      throw new ForbiddenError('Cannot cancel this request');
    }

    if (approval.status !== 'PENDING') {
      throw new Error('Can only cancel pending requests');
    }

    const updated = await this.repo.cancelRequest(approvalId);
    if (!updated) {
      throw new NotFoundError('Approval request not found');
    }

    return updated;
  }
}
