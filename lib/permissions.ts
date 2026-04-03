import type { WorkspaceRole } from '@/lib/generated/prisma'
import { canPerform, Action, Resource } from '@/lib/permissions/role-matrix'

/**
 * Workspace permission helpers — delegate to role-matrix (single source of truth).
 */

export function canInvite(role: WorkspaceRole): boolean {
  return canPerform(role, Resource.WORKSPACE, Action.INVITE_MEMBER)
}

export function canCreateProject(role: WorkspaceRole): boolean {
  return canPerform(role, Resource.PROJECT, Action.CREATE_PROJECT)
}

export function canCreateTask(role: WorkspaceRole): boolean {
  return canPerform(role, Resource.TASK, Action.CREATE_TASK)
}

/** Review approve/reject UI and route handlers (owners + managers only). */
export function canReviewApproval(role: WorkspaceRole): boolean {
  return (
    canPerform(role, Resource.APPROVAL, Action.APPROVE) ||
    canPerform(role, Resource.APPROVAL, Action.REJECT)
  )
}

export function canComment(role: WorkspaceRole): boolean {
  return canPerform(role, Resource.COMMENT, Action.CREATE_COMMENT)
}

export function canEditComment(role: WorkspaceRole, isAuthor: boolean): boolean {
  if (!isAuthor) return false
  return canPerform(role, Resource.COMMENT, Action.UPDATE_OWN_COMMENT)
}

export function canDeleteComment(role: WorkspaceRole, isAuthor: boolean): boolean {
  if (canPerform(role, Resource.COMMENT, Action.DELETE_ANY_COMMENT)) return true
  if (isAuthor && canPerform(role, Resource.COMMENT, Action.DELETE_OWN_COMMENT)) return true
  return false
}

export function canManageMembers(role: WorkspaceRole): boolean {
  return (
    canPerform(role, Resource.WORKSPACE, Action.INVITE_MEMBER) ||
    canPerform(role, Resource.WORKSPACE, Action.REMOVE_MEMBER)
  )
}

export function canArchiveProject(role: WorkspaceRole): boolean {
  return canPerform(role, Resource.PROJECT, Action.ARCHIVE_PROJECT)
}

export function hasMinimumRole(role: WorkspaceRole, minimumRole: WorkspaceRole): boolean {
  const roleHierarchy = { OWNER: 4, MANAGER: 3, MEMBER: 2, VIEWER: 1 }
  return roleHierarchy[role] >= roleHierarchy[minimumRole]
}

/** Any active workspace member may use workspace-scoped search (read-only discovery). */
export function canSearchWorkspace(_role: WorkspaceRole): boolean {
  return true
}

/** Workspace analytics UI — OWNER only (sidebar + route guard). */
export function canAccessWorkspaceAnalytics(role: WorkspaceRole): boolean {
  return role === 'OWNER'
}

/** Platform-level analytics (super-admin). Not workspace-scoped. */
export function canAccessPlatformAnalytics(platformRole: string | undefined): boolean {
  return platformRole === 'PLATFORM_OWNER'
}
