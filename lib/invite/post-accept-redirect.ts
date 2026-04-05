import { prisma } from '@/lib/db'

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
