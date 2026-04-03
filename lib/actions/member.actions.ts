'use server';

import { auth } from '@/auth';
import { getWorkspaceContext } from '@/lib/tenancy/workspace-context';
import { requirePermission } from '@/lib/permissions/rbac';
import { revalidatePath } from 'next/cache';

interface InviteMemberInput {
  workspaceId: string;
  email: string;
  role: 'MANAGER' | 'MEMBER' | 'VIEWER';
}

interface RemoveMemberInput {
  workspaceId: string;
  userId: string;
}

interface AcceptInviteInput {
  token: string;
}

/**
 * Invite a member to the workspace
 * Requires: invite_member permission (OWNER + MANAGER)
 */
export async function inviteMemberAction(input: InviteMemberInput) {
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

    requirePermission(context.role, 'invite_member');

    // TODO: Validate email format
    // TODO: Check if user already a member
    // TODO: Create Invite record with token
    // const invite = await db.invite.create({
    //   data: {
    //     workspaceId: input.workspaceId,
    //     email: input.email,
    //     role: input.role,
    //     token: generateInviteToken(),
    //     expiresAt: addDays(new Date(), 7),
    //   },
    // });

    // TODO: Send invite email with /invite/{token} link
    // TODO: Audit log

    revalidatePath(`/workspace/${input.workspaceId}/members`);

    return {
      success: true,
      message: `Invite sent to ${input.email}`,
    };
  } catch (error) {
    console.error('[inviteMemberAction]', error);
    return {
      success: false,
      error: String(error).includes('Insufficient') ? String(error) : 'Failed to invite member',
    };
  }
}

/**
 * Remove a member from the workspace
 * Requires: remove_member permission (OWNER only)
 */
export async function removeMemberAction(input: RemoveMemberInput) {
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

    requirePermission(context.role, 'remove_member');

    // TODO: Prevent removing yourself
    // TODO: Reassign tasks from removed member
    // TODO: Delete WorkspaceMember record
    // TODO: Create audit log
    // TODO: Notify removed user?

    revalidatePath(`/workspace/${input.workspaceId}/members`);

    return {
      success: true,
      message: 'Member removed',
    };
  } catch (error) {
    console.error('[removeMemberAction]', error);
    return {
      success: false,
      error: String(error).includes('Insufficient') ? String(error) : 'Failed to remove member',
    };
  }
}

/**
 * Accept an invite token and create workspace membership (requires sign-in).
 */
export async function acceptInviteAction(input: AcceptInviteInput) {
  const { acceptInviteByToken } = await import('@/lib/actions/invite-workflow');
  const result = await acceptInviteByToken(input.token);
  if (!result.ok) {
    return { success: false as const, error: result.error };
  }
  return {
    success: true as const,
    message: 'Welcome to the workspace!',
    workspaceId: result.workspaceId,
  };
}
