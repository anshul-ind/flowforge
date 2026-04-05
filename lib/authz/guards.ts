import { prisma } from '@/lib/db'
import { ForbiddenError, NotFoundError } from '@/lib/errors'
import type { OrgRole, OrganizationMember, WorkspaceMember } from '@/lib/generated/prisma'
import { canInvite } from '@/lib/permissions'
import { requireTenantContext, resolveTenantContext } from '@/lib/tenant/resolve-tenant'
import type { TenantContext } from '@/lib/tenant/tenant-context'
import { requireWorkspaceMember } from '@/lib/workspace'

const ORG_RANK: Record<OrgRole, number> = {
  ORG_ADMIN: 4,
  ORG_MANAGER: 3,
  MEMBER: 2,
  TASK_ASSIGNEE: 1,
}

/** Active org membership; enforces organization boundary. */
export async function requireOrganizationMember(
  userId: string,
  organizationId: string
): Promise<OrganizationMember> {
  const m = await prisma.organizationMember.findFirst({
    where: { userId, organizationId, status: 'ACTIVE' },
  })
  if (!m) {
    throw new ForbiddenError('You do not have access to this organization')
  }
  return m
}

/** Minimum org role (RBAC at organization layer). */
export async function requireOrgRole(
  userId: string,
  organizationId: string,
  minimumRole: OrgRole
): Promise<OrganizationMember> {
  const m = await requireOrganizationMember(userId, organizationId)
  if (ORG_RANK[m.role] < ORG_RANK[minimumRole]) {
    throw new ForbiddenError('Insufficient organization permissions')
  }
  return m
}

/**
 * Workspace access with full tenant context (user + org + workspace + role).
 * Prefer this over ad-hoc membership checks in new code.
 */
export async function requireWorkspaceAccess(
  userId: string,
  workspaceId: string
): Promise<TenantContext> {
  return requireTenantContext(workspaceId, userId)
}

/**
 * Confirms project belongs to workspace and caller is an active workspace member.
 */
export async function requireProjectAccess(
  userId: string,
  workspaceId: string,
  projectId: string
): Promise<{ id: string }> {
  await requireWorkspaceMember(userId, workspaceId)
  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId },
    select: { id: true },
  })
  if (!project) {
    throw new NotFoundError('Project not found')
  }
  return project
}

export type TaskAccessResult = {
  task: { id: string; assigneeId: string | null; projectId: string }
  membership: WorkspaceMember
}

/**
 * Task must live in workspace; TASK_ASSIGNEE may only access assigned tasks.
 */
export async function requireTaskAccess(
  userId: string,
  workspaceId: string,
  taskId: string
): Promise<TaskAccessResult> {
  const membership = await requireWorkspaceMember(userId, workspaceId)
  const task = await prisma.task.findFirst({
    where: { id: taskId, workspaceId },
    select: { id: true, assigneeId: true, projectId: true },
  })
  if (!task) {
    throw new NotFoundError('Task not found')
  }

  if (membership.role === 'TASK_ASSIGNEE') {
    const row = await prisma.taskAssignee.findUnique({
      where: { taskId_userId: { taskId: task.id, userId } },
      select: { id: true },
    })
    const isAssignee = task.assigneeId === userId || !!row
    if (!isAssignee) {
      throw new ForbiddenError('You do not have access to this task')
    }
  }

  return { task, membership }
}

/** Workspace invite creation — server-side role gate. */
export function requireInvitePermission(tenant: TenantContext): void {
  if (!canInvite(tenant.role)) {
    throw new ForbiddenError('You do not have permission to send invitations')
  }
}

/** Alias: resolves tenant or throws (same as requireTenantContext). */
export const requireCurrentTenantMembership = requireTenantContext

/**
 * Ensures the workspace sits under the given organization (anti cross-org URL tampering).
 */
export async function requireWorkspaceInOrganization(
  workspaceId: string,
  organizationId: string
): Promise<void> {
  const ws = await prisma.workspace.findFirst({
    where: { id: workspaceId, organizationId },
    select: { id: true },
  })
  if (!ws) {
    throw new ForbiddenError('Workspace does not belong to this organization')
  }
}

/** Optional tenant resolution (returns null instead of throwing). */
export async function getTenantContext(
  workspaceId: string,
  userId: string
): Promise<TenantContext | null> {
  return resolveTenantContext(workspaceId, userId)
}
