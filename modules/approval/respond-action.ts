'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { approveApprovalSchema, rejectApprovalSchema } from '@/modules/approval/schemas';
import { ApprovalService } from '@/modules/approval/service';
import { ActionResult } from '@/types/action-result';
import { ApprovalRequest } from '@/lib/generated/prisma';
import { ForbiddenError, NotFoundError } from '@/lib/errors/authorization';
import { AuditService } from '@/modules/audit/service';

/**
 * Approve an approval request
 * Changes task status to DONE
 */
export async function approveApprovalAction(input: unknown): Promise<ActionResult<ApprovalRequest>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'You must be logged in',
      };
    }

    const parsed = approveApprovalSchema.safeParse(input);
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
    const approval = await service.approveRequest(parsed.data.approvalId);

    // Update task status to DONE
    await prisma.task.update({
      where: { id: approval.taskId },
      data: { status: 'DONE' },
    });

    // Log to audit trail
    await AuditService.log({
      workspaceId: tenant.workspaceId,
      userId: session.user.id,
      action: 'APPROVAL_APPROVED',
      entityType: 'APPROVAL',
      entityId: approval.id,
      details: JSON.stringify({ taskId: approval.taskId }),
    });

    return {
      success: true,
      message: 'Approval request approved',
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
      message: 'Failed to approve request',
    };
  }
}

/**
 * Reject an approval request
 * Changes task status back to IN_PROGRESS
 * Requires rejection reason
 */
export async function rejectApprovalAction(input: unknown): Promise<ActionResult<ApprovalRequest>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'You must be logged in',
      };
    }

    const parsed = rejectApprovalSchema.safeParse(input);
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
    const approval = await service.rejectRequest(parsed.data.approvalId);

    // Update task status to IN_PROGRESS and store rejection reason in notes
    await prisma.task.update({
      where: { id: approval.taskId },
      data: { status: 'IN_PROGRESS' },
    });

    // Update approval notes with rejection reason
    await prisma.approvalRequest.update({
      where: { id: approval.id },
      data: { notes: `Rejection reason: ${parsed.data.reason}` },
    });

    // Log to audit trail
    await AuditService.log({
      workspaceId: tenant.workspaceId,
      userId: session.user.id,
      action: 'APPROVAL_REJECTED',
      entityType: 'APPROVAL',
      entityId: approval.id,
      details: JSON.stringify({ taskId: approval.taskId, reason: parsed.data.reason }),
    });

    return {
      success: true,
      message: 'Approval request rejected',
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
      message: 'Failed to reject request',
    };
  }
}
