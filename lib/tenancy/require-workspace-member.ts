import type { MemberStatus, WorkspaceMember, WorkspaceRole } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';

export class WorkspaceMemberRequiredError extends Error {
  constructor(message = 'Not a member of this workspace') {
    super(message);
    this.name = 'WorkspaceMemberRequiredError';
  }
}

export type WorkspaceMembership = Pick<
  WorkspaceMember,
  'id' | 'role' | 'status' | 'userId' | 'workspaceId' | 'joinedAt'
>;

export type RequireWorkspaceMemberOptions = {
  /** Default ACTIVE — invited/suspended users are excluded */
  allowedStatuses?: MemberStatus[];
};

/**
 * Resolves membership for (userId, workspaceId) with tenant-safe lookup.
 * Throws if the user is not a member or status is not allowed.
 */
export async function requireWorkspaceMember(
  userId: string,
  workspaceId: string,
  options?: RequireWorkspaceMemberOptions
): Promise<WorkspaceMembership> {
  const allowed = options?.allowedStatuses ?? ['ACTIVE'];

  const membership = await prisma.workspaceMember.findFirst({
    where: {
      userId,
      workspaceId,
      status: { in: allowed },
    },
    select: {
      id: true,
      role: true,
      status: true,
      userId: true,
      workspaceId: true,
      joinedAt: true,
    },
  });

  if (!membership) {
    throw new WorkspaceMemberRequiredError();
  }

  return membership;
}

export async function getWorkspaceMemberOrNull(
  userId: string,
  workspaceId: string,
  options?: RequireWorkspaceMemberOptions
): Promise<WorkspaceMembership | null> {
  const allowed = options?.allowedStatuses ?? ['ACTIVE'];

  return prisma.workspaceMember.findFirst({
    where: {
      userId,
      workspaceId,
      status: { in: allowed },
    },
    select: {
      id: true,
      role: true,
      status: true,
      userId: true,
      workspaceId: true,
      joinedAt: true,
    },
  });
}

/**
 * Membership plus role guard — use after requireWorkspaceMember when a minimum role is required.
 */
export function assertWorkspaceRole(
  role: WorkspaceRole,
  minimumRole: WorkspaceRole
): void {
  const rank: Record<WorkspaceRole, number> = {
    OWNER: 5,
    MANAGER: 4,
    MEMBER: 3,
    VIEWER: 2,
    TASK_ASSIGNEE: 1,
  };
  if (rank[role] < rank[minimumRole]) {
    throw new WorkspaceMemberRequiredError('Insufficient workspace role');
  }
}
