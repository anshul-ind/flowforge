'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { cancelApprovalSchema } from '@/modules/approval/schemas';
import { ApprovalService } from '@/modules/approval/service';
import { ActionResult } from '@/types/action-result';
import { ApprovalRequest } from '@/lib/generated/prisma';
import { ForbiddenError, NotFoundError } from '@/lib/errors/authorization';
import { AuditService } from '@/modules/audit/service';

/**
 * Cancel an approval request
 * Changes task status back to BACKLOG
 */
export async function cancelApprovalAction(input: unknown): Promise<ActionResult<ApprovalRequest>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'You must be logged in',
      };
    }

    const parsed = cancelApprovalSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: 'Invalid input',
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
    const approval = await service.cancelRequest(parsed.data.approvalId);

    // Update task status back to BACKLOG
    await prisma.task.update({
      where: { id: approval.taskId },
      data: { status: 'BACKLOG' },
    });

    // Log to audit trail
    await AuditService.log({
      workspaceId: tenant.workspaceId,
      userId: session.user.id,
      action: 'APPROVAL_REJECTED',
      entityType: 'APPROVAL',
      entityId: approval.id,
      details: JSON.stringify({ taskId: approval.taskId, action: 'CANCELLED' }),
    });

    return {
      success: true,
      message: 'Approval request cancelled',
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
      message: 'Failed to cancel request',
    };
  }
}
