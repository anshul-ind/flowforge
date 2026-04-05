import { prisma } from '@/lib/db'
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant'
import type { TenantContext } from '@/lib/tenant/tenant-context'

/** Resolve tenant from a comment row (correct workspace when user has many memberships). */
export async function resolveTenantFromCommentId(
  userId: string,
  commentId: string
): Promise<TenantContext | null> {
  const row = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { workspaceId: true },
  })
  if (!row) return null
  return resolveTenantContext(row.workspaceId, userId)
}
