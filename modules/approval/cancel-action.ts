'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant'
import { cancelApprovalSchema } from '@/modules/approval/schemas'
import { ApprovalService } from '@/modules/approval/service'
import { ActionResult } from '@/types/action-result'
import { ApprovalRequest } from '@/lib/generated/prisma'
import { ForbiddenError, NotFoundError } from '@/lib/errors/authorization'
import { AuditService } from '@/modules/audit/service'

/**
 * Cancel a pending approval — tenant is derived from the approval record.
 */
export async function cancelApprovalAction(input: unknown): Promise<ActionResult<ApprovalRequest>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'You must be logged in',
      }
    }

    const parsed = cancelApprovalSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        message: 'Invalid input',
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const row = await prisma.approvalRequest.findFirst({
      where: { id: parsed.data.approvalId },
      select: { workspaceId: true },
    })

    if (!row) {
      return {
        success: false,
        message: 'Approval not found',
      }
    }

    const tenant = await resolveTenantContext(row.workspaceId, session.user.id)
    if (!tenant) {
      return {
        success: false,
        message: 'Access denied',
      }
    }

    const service = new ApprovalService(tenant)
    const approval = await service.cancelRequest(parsed.data.approvalId)

    await prisma.task.update({
      where: { id: approval.taskId, workspaceId: row.workspaceId },
      data: { status: 'TODO' },
    })

    await AuditService.log({
      workspaceId: row.workspaceId,
      userId: session.user.id,
      action: 'TASK_UPDATED',
      entityType: 'APPROVAL',
      entityId: approval.id,
      details: JSON.stringify({ taskId: approval.taskId, action: 'APPROVAL_CANCELLED' }),
    })

    return {
      success: true,
      message: 'Approval request cancelled',
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
      message: 'Failed to cancel request',
    }
  }
}
