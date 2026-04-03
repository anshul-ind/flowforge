import { TenantContext } from '@/lib/tenant/tenant-context'
import { ForbiddenError, NotFoundError } from '@/lib/errors/authorization'
import { sanitizeText, sanitizeCommentBody } from '@/lib/input/sanitize'
import { ApprovalPolicy } from './policies'
import { ApprovalRepository } from './repository'
import { ApprovalRequest, ApprovalStatus } from '@/lib/generated/prisma'
import { notifyApprovalRequested, notifyApprovalDecided } from '@/modules/notification/service'
import { prisma } from '@/lib/db'

/**
 * Approval workflow — tenant-scoped; uses Prisma fields submittedById / reviewerId.
 */
export class ApprovalService {
  private repo: ApprovalRepository

  constructor(private tenant: TenantContext) {
    this.repo = new ApprovalRepository(tenant)
  }

  async getApproval(approvalId: string) {
    if (!ApprovalPolicy.canRead(this.tenant)) {
      throw new ForbiddenError('Cannot read approvals')
    }

    const approval = await this.repo.getApproval(approvalId)
    if (!approval) {
      throw new NotFoundError('Approval request not found')
    }

    return approval
  }

  async listApprovals(filters?: { status?: ApprovalStatus }): Promise<ApprovalRequest[]> {
    if (!ApprovalPolicy.canRead(this.tenant)) {
      throw new ForbiddenError('Cannot read approvals')
    }

    return await this.repo.listApprovals(filters)
  }

  async listMyPendingApprovals(): Promise<ApprovalRequest[]> {
    if (!ApprovalPolicy.canRead(this.tenant)) {
      throw new ForbiddenError('Cannot read approvals')
    }

    return await this.repo.listPendingForUser(this.tenant.userId)
  }

  async listMyRequests(): Promise<ApprovalRequest[]> {
    if (!ApprovalPolicy.canRead(this.tenant)) {
      throw new ForbiddenError('Cannot read approvals')
    }

    return await this.repo.listRequestedByUser(this.tenant.userId)
  }

  async createApprovalRequest(data: {
    taskId: string
    approverId: string
    notes?: string
  }): Promise<ApprovalRequest> {
    if (!ApprovalPolicy.canCreate(this.tenant)) {
      throw new ForbiddenError('Cannot create approval requests')
    }

    if (data.approverId === this.tenant.userId) {
      throw new ForbiddenError('Cannot request approval from yourself')
    }

    const sanitizedData = {
      taskId: data.taskId,
      approverId: data.approverId,
      notes: data.notes ? sanitizeCommentBody(data.notes) : undefined,
    }

    const approval = await this.repo.createApproval(sanitizedData)
    if (!approval) {
      throw new NotFoundError('Cannot create approval — task or reviewer invalid')
    }

    const taskRow = await prisma.task.findFirst({
      where: { id: data.taskId, workspaceId: this.tenant.workspaceId },
      select: { title: true },
    })
    const taskTitle = taskRow?.title ?? 'Task'

    const submitter = await prisma.user.findUnique({
      where: { id: approval.submittedById },
      select: { name: true },
    })

    await notifyApprovalRequested(
      this.tenant,
      approval.id,
      data.approverId,
      taskTitle,
      submitter?.name ?? null
    ).catch((err) => console.error('[Approval] notifyApprovalRequested:', err))

    return approval
  }

  async approveRequest(approvalId: string): Promise<ApprovalRequest> {
    if (!ApprovalPolicy.canApprove(this.tenant)) {
      throw new ForbiddenError('Cannot approve requests')
    }

    const approval = await this.getApproval(approvalId)

    const isAssignedApprover = approval.reviewerId === this.tenant.userId
    const isOwnerOrManager = this.tenant.role === 'OWNER' || this.tenant.role === 'MANAGER'

    if (!isAssignedApprover && !isOwnerOrManager) {
      throw new ForbiddenError('You are not the assigned reviewer')
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new ForbiddenError('Can only approve pending requests')
    }

    const updated = await this.repo.approveRequest(approvalId)
    if (!updated) {
      throw new NotFoundError('Approval request not found')
    }

    const approver = await prisma.user.findUnique({
      where: { id: this.tenant.userId },
      select: { name: true },
    })

    const taskTitle = approval.task?.title ?? 'Task'

    await notifyApprovalDecided(
      this.tenant,
      approvalId,
      approval.submittedById,
      taskTitle,
      'APPROVED',
      approver?.name ?? null
    ).catch((err) => console.error('[Approval] notifyApprovalDecided:', err))

    return updated
  }

  async rejectRequest(approvalId: string, rejectionReason: string): Promise<ApprovalRequest> {
    if (!ApprovalPolicy.canReject(this.tenant)) {
      throw new ForbiddenError('Cannot reject requests')
    }

    const approval = await this.getApproval(approvalId)

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new ForbiddenError('Can only reject pending requests')
    }

    const updated = await this.repo.rejectRequest(approvalId, rejectionReason)
    if (!updated) {
      throw new NotFoundError('Approval request not found')
    }

    const approver = await prisma.user.findUnique({
      where: { id: this.tenant.userId },
      select: { name: true },
    })

    const taskTitle = approval.task?.title ?? 'Task'

    await notifyApprovalDecided(
      this.tenant,
      approvalId,
      approval.submittedById,
      taskTitle,
      'REJECTED',
      approver?.name ?? null
    ).catch((err) => console.error('[Approval] notifyApprovalDecided:', err))

    return updated
  }

  async cancelRequest(approvalId: string): Promise<ApprovalRequest> {
    const approval = await this.getApproval(approvalId)

    const isRequester = approval.submittedById === this.tenant.userId
    const isOwnerOrManager = this.tenant.role === 'OWNER' || this.tenant.role === 'MANAGER'

    if (!isRequester && !isOwnerOrManager) {
      throw new ForbiddenError('Cannot cancel this request')
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new ForbiddenError('Can only cancel pending requests')
    }

    const updated = await this.repo.cancelRequest(approvalId)
    if (!updated) {
      throw new NotFoundError('Approval request not found')
    }

    return updated
  }
}
