import type { Session } from 'next-auth'
import type { WorkspaceRole } from '@/lib/generated/prisma'
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant'

/**
 * Session-scoped workspace slice (for legacy actions / RBAC helpers).
 * Always loaded from DB — never stubbed.
 */
export interface WorkspaceContext {
  workspaceId: string
  organizationId: string
  userId: string
  role: WorkspaceRole
}

export class TenantAccessError extends Error {
  constructor(message = 'Access denied to workspace') {
    super(message)
    this.name = 'TenantAccessError'
  }
}

/**
 * Resolve workspace role + org boundary from session + workspaceId.
 */
export async function getWorkspaceContext(
  session: Session | null,
  workspaceId: string
): Promise<WorkspaceContext | null> {
  if (!session?.user?.id) {
    return null
  }

  const tenant = await resolveTenantContext(workspaceId, session.user.id)
  if (!tenant) {
    return null
  }

  return {
    workspaceId: tenant.workspaceId,
    organizationId: tenant.organizationId,
    userId: tenant.userId,
    role: tenant.role,
  }
}

export function withWorkspaceHeaders(
  headers: Headers,
  context: WorkspaceContext,
  requestId: string
) {
  headers.set('x-workspace-id', context.workspaceId)
  headers.set('x-organization-id', context.organizationId)
  headers.set('x-user-id', context.userId)
  headers.set('x-request-id', requestId)
  headers.set('x-user-role', context.role)
  return headers
}
