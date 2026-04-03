'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { requireWorkspaceMember } from '@/lib/workspace'
import { canComment } from '@/lib/permissions'
import { addCommentSchema } from '@/lib/validation/comment'
import { extractMentionHandles } from '@/lib/mentions'
import { createNotification } from '@/lib/notifications'
import { createAuditLog } from '@/lib/audit'
import { commentLimiter } from '@/lib/rate-limiting/rate-limiter'
import { revalidatePath } from 'next/cache'
import { ForbiddenError } from '@/lib/errors'

export type AddCommentState =
  | null
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> }
  | { ok: true }

export async function addCommentAction(
  _prev: AddCommentState,
  formData: FormData
): Promise<AddCommentState> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { ok: false, error: 'Unauthorized' }
    }

    const parsed = addCommentSchema.safeParse({
      workspaceId: formData.get('workspaceId'),
      taskId: formData.get('taskId'),
      body: formData.get('body'),
    })

    if (!parsed.success) {
      return {
        ok: false,
        error: 'Validation failed',
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const { workspaceId, taskId, body } = parsed.data
    const trimmed = body.trim()
    if (!trimmed) {
      return { ok: false, error: 'Comment cannot be empty' }
    }

    const limitResult = commentLimiter.check(session.user.id)
    if (!limitResult.allowed) {
      return { ok: false, error: 'Too many comments. Try again later.' }
    }

    const membership = await requireWorkspaceMember(session.user.id, workspaceId)
    if (!canComment(membership.role)) {
      return { ok: false, error: 'You cannot comment in this workspace' }
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, workspaceId },
      select: { id: true, projectId: true },
    })

    if (!task) {
      return { ok: false, error: 'Task not found' }
    }

    const comment = await prisma.comment.create({
      data: {
        workspaceId,
        taskId,
        projectId: task.projectId,
        authorId: session.user.id,
        body: trimmed,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    })

    const handles = extractMentionHandles(trimmed)
    if (handles.length > 0) {
      const workspaceMembers = await prisma.workspaceMember.findMany({
        where: {
          workspaceId,
          status: 'ACTIVE',
        },
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      })

      const mentioned = workspaceMembers.filter((m) => {
        if (m.userId === session.user.id) return false
        const emailHandle = m.user.email.split('@')[0]?.toLowerCase() ?? ''
        const nameHandle =
          m.user.name?.toLowerCase().replace(/\s+/g, '') || ''
        return (
          handles.includes(emailHandle) ||
          (nameHandle.length > 0 && handles.includes(nameHandle))
        )
      })

      await Promise.all(
        mentioned.map(async (m) => {
          try {
            await prisma.commentMention.create({
              data: {
                commentId: comment.id,
                mentionedUserId: m.userId,
              },
            })
          } catch {
            // duplicate mention — ignore
          }

          await createNotification({
            userId: m.userId,
            workspaceId,
            type: 'COMMENT_MENTION',
            message: `${comment.author.name || comment.author.email} mentioned you in a comment`,
            entityType: 'comment',
            entityId: comment.id,
          })
        })
      )
    }

    await createAuditLog({
      workspaceId,
      userId: session.user.id,
      action: 'COMMENT_ADDED',
      entityType: 'comment',
      entityId: comment.id,
      details: JSON.stringify({ taskId }),
    })

    revalidatePath(
      `/workspace/${workspaceId}/projects/${task.projectId}/tasks/${taskId}`
    )

    return { ok: true }
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return { ok: false, error: e.message }
    }
    console.error('[addCommentAction]', e)
    return { ok: false, error: 'Failed to add comment' }
  }
}
