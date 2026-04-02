import { TenantContext } from '@/lib/tenant/tenant-context';
import { prisma } from '@/lib/db';

import { ApprovalRequest, ApprovalStatus } from '@/lib/generated/prisma';

/**
 * Approval Repository
 * 
 * Data access layer for approval request operations.
 * Enforces workspace boundaries.
 */
export class ApprovalRepository {
  constructor(private tenant: TenantContext) {}

  /**
   * Get approval request by ID
   * Enforces workspace scoping
   */
  async getApproval(approvalId: string): Promise<ApprovalRequest | null> {
    return await prisma.approvalRequest.findFirst({
      where: {
        id: approvalId,
        workspaceId: this.tenant.workspaceId,
      },
      include: {
        task: { select: { id: true, title: true } },
        requester: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true, email: true } },
      },
    });
  }

  /**
   * Get all approval requests in workspace
   * Can filter by status and assignee
   */
  async listApprovals(filters?: {
    status?: ApprovalStatus;
    approverId?: string;
    requesterId?: string;
  }): Promise<ApprovalRequest[]> {
    return await prisma.approvalRequest.findMany({
      where: {
        workspaceId: this.tenant.workspaceId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.approverId && { approverId: filters.approverId }),
        ...(filters?.requesterId && { requesterId: filters.requesterId }),
      },
      include: {
        task: { select: { id: true, title: true } },
        requester: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get approvals pending for a specific user
   */
  async listPendingForUser(userId: string): Promise<ApprovalRequest[]> {
    return await prisma.approvalRequest.findMany({
      where: {
        workspaceId: this.tenant.workspaceId,
        approverId: userId,
        status: 'PENDING',
      },
      include: {
        task: { select: { id: true, title: true } },
        requester: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get approvals requested by a user
   */
  async listRequestedByUser(userId: string): Promise<ApprovalRequest[]> {
    return await prisma.approvalRequest.findMany({
      where: {
        workspaceId: this.tenant.workspaceId,
        requesterId: userId,
      },
      include: {
        task: { select: { id: true, title: true } },
        approver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create approval request
   */
  async createApproval(data: {
    taskId: string;
    approverId: string;
    title: string;
    notes?: string;
  }): Promise<ApprovalRequest | null> {
    // Verify task belongs to workspace
    const task = await prisma.task.findFirst({
      where: {
        id: data.taskId,
        workspaceId: this.tenant.workspaceId,
      },
    });
    if (!task) return null;

    // Verify approver is a workspace member
    const isMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: data.approverId,
          workspaceId: this.tenant.workspaceId,
        },
      },
    });
    if (!isMember) return null;

    return await prisma.approvalRequest.create({
      data: {
        ...data,
        workspaceId: this.tenant.workspaceId,
        requesterId: this.tenant.userId,
      },
      include: {
        task: { select: { id: true, title: true } },
        requester: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Update approval request status
   * Enforces workspace scoping
   */
  async updateApprovalStatus(
    approvalId: string,
    status: ApprovalStatus
  ): Promise<ApprovalRequest | null> {
    const approval = await this.getApproval(approvalId);
    if (!approval) return null;

    return await prisma.approvalRequest.update({
      where: { id: approvalId },
      data: { status },
      include: {
        task: { select: { id: true, title: true } },
        requester: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Approve a request
   */
  async approveRequest(approvalId: string): Promise<ApprovalRequest | null> {
    const approval = await this.getApproval(approvalId);
    if (!approval || approval.status !== 'PENDING') return null;

    return await this.updateApprovalStatus(approvalId, 'APPROVED');
  }

  /**
   * Reject a request
   */
  async rejectRequest(approvalId: string): Promise<ApprovalRequest | null> {
    const approval = await this.getApproval(approvalId);
    if (!approval || approval.status !== 'PENDING') return null;

    return await this.updateApprovalStatus(approvalId, 'REJECTED');
  }

  /**
   * Cancel a pending approval request
   */
  async cancelRequest(approvalId: string): Promise<ApprovalRequest | null> {
    const approval = await this.getApproval(approvalId);
    if (!approval || approval.status !== 'PENDING') return null;

    return await this.updateApprovalStatus(approvalId, 'CANCELLED');
  }
}
