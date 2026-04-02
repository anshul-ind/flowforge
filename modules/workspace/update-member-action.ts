'use server';

import { auth } from '@/auth';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { WorkspaceService } from '@/modules/workspace/service';
import { updateMemberRoleSchema } from '@/modules/workspace/schemas';
import { ActionResult } from '@/types/action-result';
import { WorkspaceMember } from '@/lib/generated/prisma';
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { TenantContext } from '@/lib/tenant/tenant-context';

/**
 * Update member role in workspace
 * 
 * Server Action
 * POST /api/workspace/[id]/update-member-action
 * 
 * Flow:
 * 1. Get authenticated session
 * 2. Resolve tenant to ensure user has access
 * 3. Validate input (memberId + newRole)
 * 4. Call workspaceService.updateMemberRole()
 * 5. Return ActionResult with updated member data
 * 
 * Errors:
 * - ValidationError: Invalid role or cannot change OWNER role
 * - ForbiddenError: User lacks permission (must be OWNER or MANAGER)
 * - NotFoundError: Member not found in workspace
 * 
 * Requires: OWNER role (only owners can change roles)
 * 
 * Note: workspaceId is expected to come from form data or request context
 */
export async function updateMemberRoleAction(
  workspaceId: string,
  input: unknown
): Promise<ActionResult<WorkspaceMember>> {
  try {
    // Get session
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'You must be logged in',
      };
    }

    // Resolve tenant (validates workspace access)
    const tenantData = await resolveTenantContext(workspaceId, session.user.id);
    if (!tenantData) {
      return {
        success: false,
        message: 'Workspace not found or you do not have access',
      };
    }

    // Create tenant context for service
    const tenant: TenantContext = {
      workspaceId: tenantData.workspaceId,
      userId: tenantData.userId,
      role: tenantData.role,
    };

    // Validate input
    const parsed = updateMemberRoleSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: 'Invalid member role update',
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const { memberId, role } = parsed.data;

    // Update member role
    const service = new WorkspaceService(tenant);
    const member = await service.updateMemberRole(memberId, role);

    return {
      success: true,
      message: 'Member role updated successfully',
      data: member,
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

    console.error('Error updating member role:', error);
    return {
      success: false,
      message: 'Failed to update member role. Please try again.',
    };
  }
}
