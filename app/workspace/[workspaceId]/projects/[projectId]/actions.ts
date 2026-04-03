'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth/require-user'
import { requireWorkspaceMember } from '@/lib/workspace'
import { canCreateTask, canReviewApproval } from '@/lib/permissions'
import {
  createTaskSchema,
  submitForApprovalSchema,
  reviewApprovalSchema,
} from '@/lib/validation/task'
import { createNotification } from '@/lib/notifications'
import { createAuditLog } from '@/lib/audit'
import { prisma } from '@/lib/db'
import { Prisma, type TaskPriority } from '@/lib/generated/prisma'

export async function createTaskAction(_prev: unknown, formData: FormData) {
  try {
    const user = await requireUser()

    const parsed = createTaskSchema.safeParse({
      workspaceId: formData.get('workspaceId'),
      projectId: formData.get('projectId'),
      title: formData.get('title'),
      description: formData.get('description') || undefined,
      assigneeId: formData.get('assigneeId') || undefined,
      dueDate: formData.get('dueDate') || undefined,
      requiresApproval: formData.get('requiresApproval')?.toString(),
      priority: (formData.get('priority')?.toString().toUpperCase() || 'MEDIUM') as TaskPriority,
    })

    if (!parsed.success) {
      return { ok: false as const, error: 'Validation failed', details: parsed.error.flatten() }
    }

    const {
      workspaceId,
      projectId,
      title,
      description,
      assigneeId,
      dueDate,
      requiresApproval,
      priority,
    } = parsed.data

    const membership = await requireWorkspaceMember(user.id, workspaceId)
    if (!canCreateTask(membership.role)) {
      return { ok: false as const, error: 'You do not have permission to create tasks' }
    }

    const projectRecord = await prisma.project.findFirst({
      where: { id: projectId, workspaceId },
    })
    if (!projectRecord) {
      return { ok: false as const, error: 'Project not found' }
    }

    if (assigneeId) {
      const assigneeMembership = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: assigneeId, workspaceId } },
      })
      if (
        !assigneeMembership ||
        (assigneeMembership.status !== 'ACTIVE' && assigneeMembership.status !== 'INVITED')
      ) {
        return {
          ok: false as const,
          error: 'Assignee must be an active or invited workspace member',
        }
      }
    }

    const task = await prisma.task.create({
      data: {
        workspaceId,
        projectId,
        title,
        description: description?.trim() || null,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById: user.id,
        requiresApproval,
        priority,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { title: true } },
      },
    })

    if (assigneeId) {
      await createNotification({
        userId: assigneeId,
        workspaceId,
        type: 'TASK_ASSIGNED',
        message: `You were assigned a new task: ${title}`,
        entityType: 'task',
        entityId: task.id,
      })
    }

    await createAuditLog({
      workspaceId,
      userId: user.id,
      action: 'TASK_CREATED',
      entityType: 'task',
      entityId: task.id,
      details: JSON.stringify({
        projectId,
        assigneeId: assigneeId ?? null,
        requiresApproval,
        title: task.project.title,
      }),
    })

    revalidatePath(`/workspace/${workspaceId}/projects/${projectId}`)
    revalidatePath(`/workspace/${workspaceId}/projects/${projectId}/tasks`)
    revalidatePath(`/workspace/${workspaceId}/projects/${projectId}/tasks/${task.id}`)

    return {
      ok: true as const,
      taskId: task.id,
      message: 'Task created successfully',
    }
  } catch (e) {
    console.error('[createTaskAction]', e)
    return { ok: false as const, error: 'Failed to create task' }
  }
}

export async function submitTaskForApprovalAction(_prev: unknown, formData: FormData) {
  try {
    const user = await requireUser()

    const parsed = submitForApprovalSchema.safeParse({
      workspaceId: formData.get('workspaceId'),
      taskId: formData.get('taskId'),
      submitNote: formData.get('submitNote') || undefined,
    })

    if (!parsed.success) {
      return { ok: false as const, error: 'Validation failed', details: parsed.error.flatten() }
    }

    const { workspaceId, taskId, submitNote } = parsed.data
    await requireWorkspaceMember(user.id, workspaceId)

    const task = await prisma.task.findFirst({
      where: { id: taskId, workspaceId },
      include: {
        project: { select: { id: true, title: true } },
      },
    })

    if (!task) {
      return { ok: false as const, error: 'Task not found' }
    }

    if (task.assigneeId !== user.id) {
      return { ok: false as const, error: 'Only the assigned user can submit this task for approval' }
    }

    if (!task.requiresApproval) {
      return { ok: false as const, error: 'This task does not require approval' }
    }

    if (task.status === 'IN_REVIEW' || task.status === 'DONE') {
      return { ok: false as const, error: 'Task cannot be submitted in its current status' }
    }

    const existingPending = await prisma.approvalRequest.findFirst({
      where: {
        taskId,
        workspaceId,
        status: 'PENDING',
      },
    })

    if (existingPending) {
      revalidatePath(`/workspace/${workspaceId}/projects/${task.projectId}/tasks/${taskId}`)
      return {
        ok: true as const,
        approvalId: existingPending.id,
        message: 'This task is already pending approval',
        alreadyExists: true as const,
      }
    }

    const reviewer = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        role: { in: ['OWNER', 'MANAGER'] },
        status: 'ACTIVE',
      },
      orderBy: { joinedAt: 'asc' },
    })

    if (!reviewer) {
      return { ok: false as const, error: 'No reviewer available for approvals' }
    }

    const approval = await prisma.$transaction(async (tx) => {
      const created = await tx.approvalRequest.create({
        data: {
          workspaceId,
          taskId,
          submittedById: user.id,
          reviewerId: reviewer.userId,
          submitNote: submitNote?.trim() || null,
        },
      })

      await tx.task.update({
        where: { id: taskId },
        data: {
          status: 'IN_REVIEW',
          submittedAt: new Date(),
        },
      })

      return created
    })

    await createNotification({
      userId: reviewer.userId,
      workspaceId,
      type: 'TASK_SUBMITTED',
      message: `Task submitted for approval: "${task.title}"`,
      entityType: 'approval',
      entityId: approval.id,
    })

    await createAuditLog({
      workspaceId,
      userId: user.id,
      action: 'APPROVAL_SUBMITTED',
      entityType: 'approval',
      entityId: approval.id,
      details: JSON.stringify({ taskId, submitNote: submitNote ?? null }),
    })

    revalidatePath(`/workspace/${workspaceId}/projects/${task.projectId}/tasks/${taskId}`)
    revalidatePath(`/workspace/${workspaceId}/projects/${task.projectId}/approvals`)

    return {
      ok: true as const,
      approvalId: approval.id,
      message: 'Task submitted for approval',
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const tid = formData.get('taskId')
      const wid = formData.get('workspaceId')
      if (typeof tid === 'string' && typeof wid === 'string') {
        const pending = await prisma.approvalRequest.findFirst({
          where: { taskId: tid, workspaceId: wid, status: 'PENDING' },
        })
        if (pending) {
          return {
            ok: true as const,
            approvalId: pending.id,
            message: 'This task is already pending approval',
            alreadyExists: true as const,
          }
        }
      }
    }
    console.error('[submitTaskForApprovalAction]', e)
    return { ok: false as const, error: 'Failed to submit task for approval' }
  }
}

export async function reviewApprovalAction(_prev: unknown, formData: FormData) {
  try {
    const user = await requireUser()

    const parsed = reviewApprovalSchema.safeParse({
      workspaceId: formData.get('workspaceId'),
      approvalId: formData.get('approvalId'),
      decision: formData.get('decision'),
      rejectionReason: formData.get('rejectionReason') || undefined,
    })

    if (!parsed.success) {
      return { ok: false as const, error: 'Validation failed', details: parsed.error.flatten() }
    }

    const { workspaceId, approvalId, decision, rejectionReason } = parsed.data
    const isApproved = decision === 'APPROVE'

    const membership = await requireWorkspaceMember(user.id, workspaceId)
    if (!canReviewApproval(membership.role)) {
      return { ok: false as const, error: 'You do not have permission to review approvals' }
    }

    const approval = await prisma.approvalRequest.findFirst({
      where: { id: approvalId, workspaceId },
      include: {
        task: { select: { id: true, title: true, projectId: true } },
      },
    })

    if (!approval) {
      return { ok: false as const, error: 'Approval request not found' }
    }

    if (approval.status !== 'PENDING') {
      return { ok: false as const, error: 'This approval has already been reviewed' }
    }

    if (approval.reviewerId && approval.reviewerId !== user.id) {
      return { ok: false as const, error: 'You are not the reviewer for this request' }
    }

    const reason = isApproved ? null : rejectionReason!.trim()

    await prisma.$transaction(async (tx) => {
      await tx.approvalRequest.update({
        where: { id: approvalId },
        data: {
          status: isApproved ? 'APPROVED' : 'REJECTED',
          rejectionReason: reason,
          actedAt: new Date(),
        },
      })

      await tx.task.update({
        where: { id: approval.task.id, workspaceId },
        data: {
          status: isApproved ? 'DONE' : 'TODO',
        },
      })
    })

    await createNotification({
      userId: approval.submittedById,
      workspaceId,
      type: isApproved ? 'APPROVAL_APPROVED' : 'APPROVAL_REJECTED',
      message: isApproved
        ? `Your task "${approval.task.title}" was approved`
        : `Your task "${approval.task.title}" was rejected: ${reason}`,
      entityType: 'approval',
      entityId: approval.id,
    })

    await createAuditLog({
      workspaceId,
      userId: user.id,
      action: isApproved ? 'APPROVAL_APPROVED' : 'APPROVAL_REJECTED',
      entityType: 'approval',
      entityId: approval.id,
      details: isApproved
        ? `Approved task "${approval.task.title}"`
        : `Rejected task "${approval.task.title}": ${reason}`,
    })

    revalidatePath(`/workspace/${workspaceId}/projects/${approval.task.projectId}/approvals`)
    revalidatePath(`/workspace/${workspaceId}/projects/${approval.task.projectId}/tasks/${approval.task.id}`)

    return {
      ok: true as const,
      message: isApproved ? 'Task approved successfully' : 'Task rejected',
    }
  } catch (e) {
    console.error('[reviewApprovalAction]', e)
    return { ok: false as const, error: 'Failed to review approval' }
  }
}
