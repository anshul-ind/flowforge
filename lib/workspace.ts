import { prisma } from './db'
import { ForbiddenError, NotFoundError } from './errors'
import { hashInviteToken } from '@/lib/invite/token-hash'

/**
 * Verify user is a member of the workspace
 */
export async function requireWorkspaceMember(userId: string, workspaceId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { workspaceId, userId },
    },
  })

  if (!membership || membership.status !== 'ACTIVE') {
    throw new ForbiddenError('You do not have access to this workspace')
  }

  return membership
}

/**
 * Get workspace with all members
 */
export async function getWorkspaceWithMembers(workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        include: { user: { select: { id: true, email: true, name: true } } },
      },
    },
  })

  if (!workspace) {
    throw new NotFoundError('Workspace not found')
  }

  return workspace
}

/**
 * Get user's workspaces
 */
export async function getUserWorkspaces(userId: string) {
  return prisma.workspaceMember.findMany({
    where: { userId },
    include: { workspace: true },
  })
}

/**
 * Check if user can perform action in workspace
 */
export async function canUserPerformAction(
  userId: string,
  workspaceId: string,
  requiredRole: string
) {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { workspaceId, userId },
    },
  })

  if (!membership || membership.status !== 'ACTIVE') {
    return false
  }

  const roleHierarchy = { OWNER: 5, MANAGER: 4, MEMBER: 3, VIEWER: 2, TASK_ASSIGNEE: 1 }
  const userRoleLevel = roleHierarchy[membership.role] || 0
  const requiredRoleLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0

  return userRoleLevel >= requiredRoleLevel
}

/**
 * Get pending invites for workspace
 */
export async function getPendingInvites(workspaceId: string) {
  return prisma.workspaceInvite.findMany({
    where: {
      workspaceId,
      status: 'PENDING',
      expiresAt: { gt: new Date() },
      revokedAt: null,
    },
  })
}

/**
 * Validate invite token
 */
export async function validateInviteToken(token: string) {
  const invite = await prisma.workspaceInvite.findUnique({
    where: { tokenHash: hashInviteToken(token.trim()) },
    include: { workspace: true },
  })

  if (!invite) {
    throw new NotFoundError('Invite not found')
  }

  if (invite.status === 'REVOKED') {
    throw new ForbiddenError('This invite has been revoked')
  }

  if (invite.status === 'ACCEPTED' || invite.acceptedAt) {
    throw new ForbiddenError('This invite has already been accepted')
  }

  if (invite.status === 'EXPIRED' || invite.expiresAt < new Date()) {
    throw new ForbiddenError('This invite has expired')
  }

  if (invite.status !== 'PENDING') {
    throw new ForbiddenError('This invite is not valid')
  }

  return invite
}
