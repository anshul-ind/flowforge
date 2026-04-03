import { prisma } from './db'
import { ForbiddenError, NotFoundError } from './errors'

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

  const roleHierarchy = { OWNER: 4, MANAGER: 3, MEMBER: 2, VIEWER: 1 }
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
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
  })
}

/**
 * Validate invite token
 */
export async function validateInviteToken(token: string) {
  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    include: { workspace: true },
  })

  if (!invite) {
    throw new NotFoundError('Invite not found')
  }

  if (invite.acceptedAt) {
    throw new ForbiddenError('This invite has already been accepted')
  }

  if (invite.expiresAt < new Date()) {
    throw new ForbiddenError('This invite has expired')
  }

  return invite
}
