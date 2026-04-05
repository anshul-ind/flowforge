'use server';

import { auth } from '@/auth';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { WorkspaceService } from '@/modules/workspace/service';
import { removeMemberSchema } from '@/modules/workspace/schemas';
import { ActionResult } from '@/types/action-result';
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
/**
 * Remove member from workspace
 * 
 * Server Action
 * POST /api/workspace/[id]/remove-member-action
 * 
 * Flow:
 * 1. Get authenticated session
 * 2. Resolve tenant to ensure user has access
 * 3. Validate input (memberId)
 * 4. Call workspaceService.removeMember()
 * 5. Return ActionResult (success with no data)
 * 
 * Errors:
 * - ValidationError: Cannot remove last owner
 * - ForbiddenError: User lacks permission (must be OWNER or MANAGER)
 * - NotFoundError: Member not found in workspace
 * 
 * Requires: OWNER or MANAGER role
 * 
 * Safety: Prevents removing the last owner of the workspace
 * 
 * Note: workspaceId is expected to come from form data or request context
 */
export async function removeMemberAction(
  workspaceId: string,
  input: unknown
): Promise<ActionResult<null>> {
  try {
    // Get session
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'You must be logged in',
      };
    }

    const tenant = await resolveTenantContext(workspaceId, session.user.id);
    if (!tenant) {
      return {
        success: false,
        message: 'Workspace not found or you do not have access',
      };
    }

    // Validate input
    const parsed = removeMemberSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: 'Invalid member removal request',
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const { memberId } = parsed.data;

    // Remove member
    const service = new WorkspaceService(tenant);
    await service.removeMember(memberId);

    return {
      success: true,
      message: 'Member removed successfully',
      data: null,
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        success: false,
        message: error.message,
      };
    }

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

    console.error('Error removing member:', error);
    return {
      success: false,
      message: 'Failed to remove member. Please try again.',
    };
  }
}
