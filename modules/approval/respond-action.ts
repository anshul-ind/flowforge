'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant'
import { approveApprovalSchema, rejectApprovalSchema } from '@/modules/approval/schemas'
import { ApprovalService } from '@/modules/approval/service'
import { ActionResult } from '@/types/action-result'
import { ApprovalRequest } from '@/lib/generated/prisma'
import { ForbiddenError, NotFoundError } from '@/lib/errors/authorization'
import { AuditService } from '@/modules/audit/service'

async function tenantForApproval(approvalId: string, userId: string) {
  const row = await prisma.approvalRequest.findFirst({
    where: { id: approvalId },
    select: { workspaceId: true, taskId: true },
  })
  if (!row) return null
  const tenant = await resolveTenantContext(row.workspaceId, userId)
  if (!tenant) return null
  return { tenant, taskId: row.taskId, workspaceId: row.workspaceId }
}

/**
 * Approve an approval request (legacy module path — prefer project actions for unified flow).
 */
export async function approveApprovalAction(input: unknown): Promise<ActionResult<ApprovalRequest>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'You must be logged in',
      }
    }

    const parsed = approveApprovalSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        message: 'Invalid input',
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const ctx = await tenantForApproval(parsed.data.approvalId, session.user.id)
    if (!ctx) {
      return {
        success: false,
        message: 'Approval not found or access denied',
      }
    }

    const service = new ApprovalService(ctx.tenant)
    const approval = await service.approveRequest(parsed.data.approvalId)

    await prisma.task.update({
      where: { id: approval.taskId, workspaceId: ctx.workspaceId },
      data: { status: 'DONE' },
    })

    await AuditService.log({
      workspaceId: ctx.workspaceId,
      userId: session.user.id,
      action: 'APPROVAL_APPROVED',
      entityType: 'APPROVAL',
      entityId: approval.id,
      details: JSON.stringify({ taskId: approval.taskId }),
    })

    return {
      success: true,
      message: 'Approval request approved',
      data: approval,
    }
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        success: false,
        message: error.message,
      }
    }

    if (error instanceof NotFoundError) {
      return {
        success: false,
        message: error.message,
      }
    }

    return {
      success: false,
      message: 'Failed to approve request',
    }
  }
}

/**
 * Reject an approval request — persists rejectionReason on ApprovalRequest; task returns to TODO.
 */
export async function rejectApprovalAction(input: unknown): Promise<ActionResult<ApprovalRequest>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'You must be logged in',
      }
    }

    const parsed = rejectApprovalSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        message: 'Invalid input',
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const ctx = await tenantForApproval(parsed.data.approvalId, session.user.id)
    if (!ctx) {
      return {
        success: false,
        message: 'Approval not found or access denied',
      }
    }

    const service = new ApprovalService(ctx.tenant)
    const approval = await service.rejectRequest(parsed.data.approvalId, parsed.data.reason)

    await prisma.task.update({
      where: { id: approval.taskId, workspaceId: ctx.workspaceId },
      data: { status: 'TODO' },
    })

    await AuditService.log({
      workspaceId: ctx.workspaceId,
      userId: session.user.id,
      action: 'APPROVAL_REJECTED',
      entityType: 'APPROVAL',
      entityId: approval.id,
      details: JSON.stringify({ taskId: approval.taskId, reason: parsed.data.reason }),
    })

    return {
      success: true,
      message: 'Approval request rejected',
      data: approval,
    }
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        success: false,
        message: error.message,
      }
    }

    if (error instanceof NotFoundError) {
      return {
        success: false,
        message: error.message,
      }
    }

    return {
      success: false,
      message: 'Failed to reject request',
    }
  }
}
