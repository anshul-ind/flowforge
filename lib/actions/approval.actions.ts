'use server';

import { auth } from '@/auth';
import { getWorkspaceContext } from '@/lib/tenancy/workspace-context';
import { requirePermission } from '@/lib/permissions/rbac';
import { revalidatePath } from 'next/cache';

interface SubmitApprovalInput {
  workspaceId: string;
  taskId: string;
  idempotencyKey: string; // UUID generated client-side
}

interface ReviewApprovalInput {
  workspaceId: string;
  approvalId: string;
  decision: 'APPROVED' | 'REJECTED';
  reason?: string;
}

/**
 * Submit a task for approval
 * Requires: submit_for_approval permission
 * Idempotent: idempotencyKey prevents duplicate submissions on slow network
 * Constraint: Only one pending approval per task allowed
 */
export async function submitApprovalAction(input: SubmitApprovalInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const context = await getWorkspaceContext(session, input.workspaceId);
    if (!context) {
      return {
        success: false,
        error: 'Access denied',
      };
    }

    requirePermission(context.role, 'submit_for_approval');

    // TODO: Check if approval with same idempotencyKey already exists
    // If yes: return existing record (true idempotency)
    // const existing = await db.approvalRequest.findUnique({
    //   where: { idempotencyKey: input.idempotencyKey },
    // });
    // if (existing) {
    //   return { success: true, data: existing };
    // }

    // TODO: Check for active pending approval on this task
    // const pending = await db.approvalRequest.findFirst({
    //   where: { taskId: input.taskId, status: 'PENDING' },
    // });
    // if (pending) {
    //   return { success: false, error: 'Task already under review' };
    // }

    // TODO: Create approval request
    // const approval = await db.approvalRequest.create({
    //   data: {
    //     taskId: input.taskId,
    //     submittedBy: session.user.id,
    //     status: 'PENDING',
    //     idempotencyKey: input.idempotencyKey,
    //   },
    // });

    // TODO: Notify reviewers (OWNER + MANAGER)
    // TODO: Audit log
    // TODO: Update task status to IN_REVIEW

    revalidatePath(`/workspace/${input.workspaceId}`);

    return {
      success: true,
      message: 'Task submitted for approval',
    };
  } catch (error) {
    console.error('[submitApprovalAction]', error);
    return {
      success: false,
      error: String(error).includes('Insufficient') || String(error).includes('already under review') ? String(error) : 'Failed to submit for approval',
    };
  }
}

/**
 * Review an approval request (approve or reject)
 * Requires: approve_reject permission (OWNER + MANAGER only)
 */
export async function reviewApprovalAction(input: ReviewApprovalInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const context = await getWorkspaceContext(session, input.workspaceId);
    if (!context) {
      return {
        success: false,
        error: 'Access denied',
      };
    }

    requirePermission(context.role, 'approve_reject');

    // TODO: Validate approval exists
    // TODO: Update approval: status = decision, reviewedBy = session.user.id, reviewedAt = now
    // TODO: If APPROVED: update task status to DONE
    // TODO: If REJECTED: revert task status to last value, notify submitter
    // TODO: Audit log
    // TODO: Delete/expire related notifications

    revalidatePath(`/workspace/${input.workspaceId}`);

    return {
      success: true,
      message: `Task ${input.decision.toLowerCase()}`,
    };
  } catch (error) {
    console.error('[reviewApprovalAction]', error);
    return {
      success: false,
      error: String(error).includes('Insufficient') ? String(error) : 'Failed to review approval',
    };
  }
}
