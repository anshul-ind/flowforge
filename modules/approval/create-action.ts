'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant'
import { createApprovalSchema } from '@/modules/approval/schemas'
import { ApprovalService } from '@/modules/approval/service'
import { ActionResult } from '@/types/action-result'
import { ApprovalRequest, ApprovalStatus } from '@/lib/generated/prisma'
import { ForbiddenError, NotFoundError } from '@/lib/errors/authorization'
import { AuditService } from '@/modules/audit/service'

/**
 * Create an approval request for a task — tenant resolved from the task row (never arbitrary membership).
 */
export async function createApprovalAction(input: unknown): Promise<ActionResult<ApprovalRequest>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'You must be logged in',
      }
    }

    const parsed = createApprovalSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        message: 'Invalid approval data',
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const task = await prisma.task.findFirst({
      where: { id: parsed.data.taskId },
      select: { id: true, workspaceId: true, title: true, status: true },
    })

    if (!task) {
      return {
        success: false,
        message: 'Task not found',
      }
    }

    const tenant = await resolveTenantContext(task.workspaceId, session.user.id)

    if (!tenant) {
      return {
        success: false,
        message: 'Cannot access workspace for this task',
      }
    }

    const pending = await prisma.approvalRequest.findFirst({
      where: {
        taskId: task.id,
        workspaceId: task.workspaceId,
        status: ApprovalStatus.PENDING,
      },
    })

    if (pending) {
      return {
        success: false,
        message: 'This task already has a pending approval request',
      }
    }

    const service = new ApprovalService(tenant)

    const approval = await service.createApprovalRequest({
      taskId: parsed.data.taskId,
      approverId: parsed.data.reviewerId,
      notes: parsed.data.note,
    })

    await prisma.task.update({
      where: { id: task.id, workspaceId: task.workspaceId },
      data: { status: 'IN_REVIEW' },
    })

    await AuditService.log({
      workspaceId: tenant.workspaceId,
      userId: session.user.id,
      action: 'APPROVAL_SUBMITTED',
      entityType: 'APPROVAL',
      entityId: approval.id,
      details: JSON.stringify({ taskId: parsed.data.taskId }),
    })

    return {
      success: true,
      message: 'Approval request created',
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
      message: 'Failed to create approval request',
    }
  }
}
