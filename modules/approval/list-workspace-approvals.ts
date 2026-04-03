'use server'

import { requireUser } from '@/lib/auth/require-user'
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant'
import { ApprovalService } from '@/modules/approval/service'
import type { ApprovalRequest } from '@/lib/generated/prisma'

/**
 * Server entry for client components — lists approvals in one workspace (no Prisma on client).
 */
export async function listWorkspaceApprovalsForClient(
  workspaceId: string
): Promise<ApprovalRequest[]> {
  const user = await requireUser()
  const tenant = await resolveTenantContext(workspaceId, user.id)
  if (!tenant) {
    throw new Error('Workspace access denied')
  }
  const service = new ApprovalService(tenant)
  return service.listApprovals()
}
