import { prisma } from '@/lib/db'
import { ForbiddenError } from '@/lib/errors'
import { TenantContext } from './tenant-context'

export async function resolveTenantContext(
  workspaceId: string,
  userId: string
): Promise<TenantContext | null> {
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
    return null
  }

  return {
    workspaceId: membership.workspaceId,
    organizationId: membership.workspace.organizationId,
    userId: membership.userId,
    role: membership.role,
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
