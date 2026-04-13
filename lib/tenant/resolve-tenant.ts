import { prisma } from '@/lib/db'
import { ForbiddenError } from '@/lib/errors'
import { TenantContext } from './tenant-context'

const AUTH_DEBUG = process.env.AUTH_DEBUG === '1'

export async function resolveTenantContext(
  workspaceId: string,
  userId: string
): Promise<TenantContext | null> {
  const startedAt = AUTH_DEBUG ? Date.now() : 0
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId,
      status: 'ACTIVE',
    },
    include: {
      workspace: { select: { organizationId: true } },
    },
  })

  if (!membership?.workspace) {
    if (AUTH_DEBUG) {
      console.log('[tenant] resolveTenantContext=null', {
        workspaceId,
        userId,
        durationMs: Date.now() - startedAt,
        reason: membership ? 'workspace-missing' : 'membership-missing',
      })
    }
    return null
  }

  if (AUTH_DEBUG) {
    console.log('[tenant] resolveTenantContext=ok', {
      workspaceId,
      userId,
      organizationId: membership.workspace.organizationId,
      role: membership.role,
      durationMs: Date.now() - startedAt,
    })
  }

  return {
    workspaceId: membership.workspaceId,
    organizationId: membership.workspace.organizationId,
    userId: membership.userId,
    role: membership.role,
    restrictedProjectId: membership.restrictedProjectId,
    restrictedTaskId: membership.restrictedTaskId,
  }
}

/**
 * Server-side guard: active workspace membership with org boundary attached.
 */
export async function requireTenantContext(
  workspaceId: string,
  userId: string
): Promise<TenantContext> {
  const ctx = await resolveTenantContext(workspaceId, userId)
  if (!ctx) {
    throw new ForbiddenError('You do not have access to this workspace')
  }
  return ctx
}
