import { auth } from '@/auth';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { WorkspaceService } from '@/modules/workspace/service';
import { updateWorkspaceSchema } from '@/modules/workspace/schemas';
import { ActionResult } from '@/types/action-result';
import { Workspace } from '@/lib/generated/prisma';
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { TenantContext } from '@/lib/tenant/tenant-context';

/**
 * Update workspace settings
 * 
 * Server Action
 * POST /api/workspace/[id]/update-action
 * 
 * Flow:
 * 1. Get authenticated session
 * 2. Resolve tenant to ensure user has access
 * 3. Validate input against schema
 * 4. Call workspaceService.updateWorkspace()
 * 5. Return ActionResult with updated workspace
 * 
 * Errors:
 * - ValidationError: Input validation failed
 * - ForbiddenError: User lacks permission to update
 * - NotFoundError: Workspace not found
 * 
 * Requires: MANAGER or OWNER role
 * 
 * Note: workspaceId is expected to come from form data or request context
 */
export async function updateWorkspaceAction(
  workspaceId: string,
  input: unknown
): Promise<ActionResult<Workspace>> {
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
    const parsed = updateWorkspaceSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: 'Invalid workspace details',
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    // Update workspace
    const service = new WorkspaceService(tenant);
    const workspace = await service.updateWorkspace(parsed.data);

    return {
      success: true,
      message: 'Workspace updated successfully',
      data: workspace,
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

    console.error('Error updating workspace:', error);
    return {
      success: false,
      message: 'Failed to update workspace. Please try again.',
    };
  }
}
