'use server';

import { auth } from '@/auth';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { WorkspaceService } from '@/modules/workspace/service';
import { inviteMemberSchema } from '@/modules/workspace/schemas';
import { inviteLimiter } from '@/lib/rate-limiting/rate-limiter';
import { ActionResult } from '@/types/action-result';
import { WorkspaceMember } from '@/lib/generated/prisma';
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
/**
 * Invite member to workspace
 * 
 * Server Action
 * POST /api/workspace/[id]/invite-action
 * 
 * Flow:
 * 1. Get authenticated session
 * 2. Resolve tenant to ensure user has access
 * 3. Validate input (email + role)
 * 4. Call workspaceService.inviteMember()
 * 5. Return ActionResult with member data
 * 
 * Errors:
 * - ValidationError: Input validation failed or user already member
 * - ForbiddenError: User lacks permission to invite (must be OWNER or MANAGER)
 * - NotFoundError: User with email not found
 * 
 * Requires: OWNER or MANAGER role
 * 
 * Note: workspaceId is expected to come from form data or request context
 */
export async function inviteMemberAction(
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

    // Rate limiting: 20 invites per workspace per hour
    const limitResult = inviteLimiter.check(workspaceId);
    if (!limitResult.allowed) {
      return {
        success: false,
        message: 'Too many invitation requests. Please try again later.',
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
    const parsed = inviteMemberSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: 'Invalid invitation details',
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const { email, role } = parsed.data;

    // Invite member
    const service = new WorkspaceService(tenant);
    const member = await service.inviteMember(email, role);

    return {
      success: true,
      message: 'Member invited successfully',
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

    console.error('Error inviting member:', error);
    return {
      success: false,
      message: 'Failed to invite member. Please try again.',
    };
  }
}
