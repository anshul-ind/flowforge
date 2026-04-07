import { prisma } from '@/lib/db'

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * After accepting an invite, send the user to the most specific place we can:
 * task detail → project overview → workspace home.
 */
export async function computeInviteAcceptNextPath(
  workspaceId: string,
  inviteProjectId?: string | null,
  inviteTaskId?: string | null
): Promise<string> {
  let projectId = inviteProjectId ?? null
  const taskId = inviteTaskId ?? null

  if (taskId && !projectId) {
    const t = await prisma.task.findFirst({
      where: { id: taskId, workspaceId },
      select: { projectId: true },
    })
    projectId = t?.projectId ?? null
  }

  if (taskId && projectId) {
    return `/workspace/${workspaceId}/projects/${projectId}/tasks/${taskId}`
  }
  if (projectId) {
    return `/workspace/${workspaceId}/projects/${projectId}`
  }
  return `/workspace/${workspaceId}`
}

/**
 * Ensure redirect target still exists (deleted task/project) so users never land on 404 after accept.
 */
export async function resolveSafeInviteRedirectPath(
  userId: string,
  workspaceId: string,
  candidatePath: string
): Promise<string> {
  const base = `/workspace/${workspaceId}`
  const active = await prisma.workspaceMember.findFirst({
    where: { userId, workspaceId, status: 'ACTIVE' },
    select: { id: true },
  })
  if (!active) {
    return base
  }

  const wsSeg = escapeRegex(workspaceId)
  const taskRe = new RegExp(`^/workspace/${wsSeg}/projects/([^/]+)/tasks/([^/]+)$`)
  const taskMatch = candidatePath.match(taskRe)
  if (taskMatch) {
    const [, projectId, taskId] = taskMatch
    const task = await prisma.task.findFirst({
      where: { id: taskId, workspaceId, projectId },
      select: { id: true },
    })
    if (task) return candidatePath
    const proj = await prisma.project.findFirst({
      where: { id: projectId, workspaceId },
      select: { id: true },
    })
    if (proj) return `${base}/projects/${projectId}`
    return base
  }

  const projRe = new RegExp(`^/workspace/${wsSeg}/projects/([^/]+)$`)
  const projMatch = candidatePath.match(projRe)
  if (projMatch) {
    const projectId = projMatch[1]
    const p = await prisma.project.findFirst({
      where: { id: projectId, workspaceId },
      select: { id: true },
    })
    if (p) return candidatePath
    return base
  }

  if (candidatePath.startsWith(base)) {
    return candidatePath
  }
  return base
}
