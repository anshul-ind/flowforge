import { TenantContext } from '@/lib/tenant/tenant-context'
import { prisma } from '@/lib/db'
import { ApprovalRequest, ApprovalStatus, MemberStatus } from '@/lib/generated/prisma'

/**
 * Approval Repository — data access aligned with Prisma schema (submittedById, reviewerId).
 */
export class ApprovalRepository {
  constructor(private tenant: TenantContext) {}

  async getApproval(approvalId: string): Promise<
    | (ApprovalRequest & {
        task: { id: string; title: string }
        submitter: { id: string; name: string | null; email: string | null }
        reviewer: { id: string; name: string | null; email: string | null } | null
      })
    | null
  > {
    return await prisma.approvalRequest.findFirst({
      where: {
        id: approvalId,
        workspaceId: this.tenant.workspaceId,
      },
      include: {
        task: { select: { id: true, title: true } },
        submitter: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    })
  }

  async listApprovals(filters?: {
    status?: ApprovalStatus
    reviewerId?: string
    submittedById?: string
  }): Promise<ApprovalRequest[]> {
    return await prisma.approvalRequest.findMany({
      where: {
        workspaceId: this.tenant.workspaceId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.reviewerId && { reviewerId: filters.reviewerId }),
        ...(filters?.submittedById && { submittedById: filters.submittedById }),
      },
      include: {
        task: { select: { id: true, title: true } },
        submitter: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async listPendingForUser(userId: string): Promise<ApprovalRequest[]> {
    return await prisma.approvalRequest.findMany({
      where: {
        workspaceId: this.tenant.workspaceId,
        reviewerId: userId,
        status: ApprovalStatus.PENDING,
      },
      include: {
        task: { select: { id: true, title: true } },
        submitter: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  async listRequestedByUser(userId: string): Promise<ApprovalRequest[]> {
    return await prisma.approvalRequest.findMany({
      where: {
        workspaceId: this.tenant.workspaceId,
        submittedById: userId,
      },
      include: {
        task: { select: { id: true, title: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async createApproval(data: {
    taskId: string
    approverId: string
    notes?: string
  }): Promise<ApprovalRequest | null> {
    const task = await prisma.task.findFirst({
      where: {
        id: data.taskId,
        workspaceId: this.tenant.workspaceId,
      },
    })
    if (!task) return null

    const reviewer = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: data.approverId,
          workspaceId: this.tenant.workspaceId,
        },
      },
    })
    if (!reviewer || reviewer.status !== MemberStatus.ACTIVE) return null

    return await prisma.approvalRequest.create({
      data: {
        workspaceId: this.tenant.workspaceId,
        taskId: data.taskId,
        submittedById: this.tenant.userId,
        reviewerId: data.approverId,
        submitNote: data.notes?.trim() || null,
      },
      include: {
        task: { select: { id: true, title: true } },
        submitter: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    })
  }

  async updateApprovalStatus(
    approvalId: string,
    status: ApprovalStatus,
    options?: { rejectionReason?: string | null }
  ): Promise<ApprovalRequest | null> {
    const approval = await this.getApproval(approvalId)
    if (!approval) return null

    return await prisma.approvalRequest.update({
      where: { id: approvalId, workspaceId: this.tenant.workspaceId },
      data: {
        status,
        ...(status === ApprovalStatus.REJECTED && options?.rejectionReason !== undefined
          ? { rejectionReason: options.rejectionReason }
          : {}),
        ...(status === ApprovalStatus.APPROVED || status === ApprovalStatus.REJECTED
          ? { actedAt: new Date() }
          : {}),
      },
      include: {
        task: { select: { id: true, title: true } },
        submitter: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    })
  }

  async approveRequest(approvalId: string): Promise<ApprovalRequest | null> {
    const approval = await this.getApproval(approvalId)
    if (!approval || approval.status !== ApprovalStatus.PENDING) return null

    return await this.updateApprovalStatus(approvalId, ApprovalStatus.APPROVED)
  }

  async rejectRequest(approvalId: string, rejectionReason: string): Promise<ApprovalRequest | null> {
    const approval = await this.getApproval(approvalId)
    if (!approval || approval.status !== ApprovalStatus.PENDING) return null

    return await this.updateApprovalStatus(approvalId, ApprovalStatus.REJECTED, {
      rejectionReason: rejectionReason.trim(),
    })
  }

  async cancelRequest(approvalId: string): Promise<ApprovalRequest | null> {
    const approval = await this.getApproval(approvalId)
    if (!approval || approval.status !== ApprovalStatus.PENDING) return null

    return await this.updateApprovalStatus(approvalId, ApprovalStatus.CANCELLED)
  }
}
