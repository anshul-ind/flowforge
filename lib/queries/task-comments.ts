import { prisma } from '@/lib/db'
import type { WorkspaceRole } from '@/lib/generated/prisma'

export type TaskCommentWithAuthor = {
  id: string
  body: string
  createdAt: Date
  updatedAt: Date
  authorId: string
  author: { id: string; name: string | null; email: string }
  authorRole: WorkspaceRole
}

export async function getTaskCommentsWithAuthorRoles(
  workspaceId: string,
  taskId: string
): Promise<TaskCommentWithAuthor[]> {
  const comments = await prisma.comment.findMany({
    where: { workspaceId, taskId },
    orderBy: { createdAt: 'asc' },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
  })

  const authorIds = [...new Set(comments.map((c) => c.authorId))]
  if (authorIds.length === 0) return []

  const memberships = await prisma.workspaceMember.findMany({
    where: {
      workspaceId,
      userId: { in: authorIds },
    },
    select: { userId: true, role: true },
  })

  const roleByUser = Object.fromEntries(
    memberships.map((m) => [m.userId, m.role])
  ) as Record<string, WorkspaceRole>

  return comments.map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    authorId: c.authorId,
    author: c.author,
    authorRole: roleByUser[c.authorId] ?? 'MEMBER',
  }))
}
