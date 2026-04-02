'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { createApprovalSchema } from '@/modules/approval/schemas';
import { ApprovalService } from '@/modules/approval/service';
import { ActionResult } from '@/types/action-result';
import { ApprovalRequest } from '@/lib/generated/prisma';
import { ForbiddenError, NotFoundError } from '@/lib/errors/authorization';
import { AuditService } from '@/modules/audit/service';

/**
 * Create an approval request for a task
 */
export async function createApprovalAction(input: unknown): Promise<ActionResult<ApprovalRequest>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'You must be logged in',
      };
    }

    const parsed = createApprovalSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: 'Invalid approval data',
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const workspaceMembership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!workspaceMembership) {
      return {
        success: false,
        message: 'Not a workspace member',
      };
    }

    const tenant = await resolveTenantContext(
      workspaceMembership.workspaceId,
      session.user.id
    );

    if (!tenant) {
      return {
        success: false,
        message: 'Cannot access workspace',
      };
    }

    const service = new ApprovalService(tenant);
    
    // Get task title for approval record
    const task = await prisma.task.findUnique({
      where: { id: parsed.data.taskId },
    });

    if (!task) {
      return {
        success: false,
        message: 'Task not found',
      };
    }

    const approval = await service.createApprovalRequest({
      taskId: parsed.data.taskId,
      approverId: parsed.data.reviewerId,
      title: `Approval request for: ${task.title}`,
      notes: parsed.data.note,
    });

    // Update task status to IN_REVIEW
    await prisma.task.update({
      where: { id: parsed.data.taskId },
      data: { status: 'IN_REVIEW' },
    });

    // Log to audit trail
    await AuditService.log({
      workspaceId: tenant.workspaceId,
      userId: session.user.id,
      action: 'APPROVAL_SUBMITTED',
      entityType: 'APPROVAL',
      entityId: approval.id,
      details: JSON.stringify({ taskId: parsed.data.taskId }),
    });

    return {
      success: true,
      message: 'Approval request created',
      data: approval,
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        success: false,
        message: error.message,
      };
    }

    if (error instanceof NotFoundError) {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: false,
      message: 'Failed to create approval request',
    };
  }
}
