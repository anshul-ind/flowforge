import { prisma } from '@/lib/db'

/** Active members for task filter assignee dropdowns (workspace-scoped). */
export async function getActiveWorkspaceMembersForFilters(workspaceId: string) {
  return prisma.workspaceMember.findMany({
    where: { workspaceId, status: 'ACTIVE' },
    select: {
      userId: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { joinedAt: 'asc' },
  })
}
