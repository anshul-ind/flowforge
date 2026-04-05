'use server';

import { auth } from '@/auth';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { WorkspaceService } from '@/modules/workspace/service';
import { deleteWorkspaceSchema } from '@/modules/workspace/schemas';
import { ActionResult } from '@/types/action-result';
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
/**
 * Delete workspace
 * 
 * Server Action
 * POST /api/workspace/[id]/delete-action
 * 
 * Flow:
 * 1. Get authenticated session
 * 2. Resolve tenant to ensure user has access
 * 3. Validate confirmation input (user must type "DELETE")
 * 4. Call workspaceService.deleteWorkspace()
 * 5. Return ActionResult (success with no data)
 * 
 * Errors:
 * - ValidationError: Confirmation failed (not "DELETE")
 * - ForbiddenError: User lacks permission (must be OWNER)
 * - NotFoundError: Workspace not found
 * 
 * Requires: OWNER role
 * 
 * Safety: Requires explicit confirmation by typing "DELETE"
 * 
 * Note: workspaceId is expected to come from form data or request context
 */
export async function deleteWorkspaceAction(
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

    // Validate confirmat input
    const parsed = deleteWorkspaceSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: 'Invalid deletion confirmation',
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    // Delete workspace
    const service = new WorkspaceService(tenant);
    await service.deleteWorkspace();

    return {
      success: true,
      message: 'Workspace deleted successfully',
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

    console.error('Error deleting workspace:', error);
    return {
      success: false,
      message: 'Failed to delete workspace. Please try again.',
    };
  }
}
