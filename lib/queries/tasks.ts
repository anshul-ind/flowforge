import { prisma } from '@/lib/db'

/**
 * Get task with all related information
 */
export async function getTaskWithRelations(taskId: string, workspaceId: string) {
  return prisma.task.findFirst({
    where: { id: taskId, workspaceId },
    include: {
      project: true,
      assignee: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      comments: {
        include: {
          author: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      approvalRequests: {
        include: {
          submitter: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

/**
 * Get pending tasks for a user in a workspace
 */
export async function getPendingTasksForUser(
  userId: string,
  workspaceId: string
) {
  return prisma.task.findMany({
    where: {
      workspaceId,
      assigneeId: userId,
      status: { not: 'DONE' },
    },
    include: {
      project: true,
      assignee: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: { dueDate: 'asc' },
  })
}

/**
 * Get tasks pending approval in a workspace
 */
export async function getTasksPendingApproval(workspaceId: string) {
  return prisma.task.findMany({
    where: {
      workspaceId,
      status: 'IN_REVIEW',
    },
    include: {
      project: true,
      assignee: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      approvalRequests: {
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { submittedAt: 'desc' },
  })
}

/**
 * Get tasks by status in a project
 */
export async function getTasksByStatusInProject(
  projectId: string,
  workspaceId: string
) {
  return prisma.task.findMany({
    where: {
      projectId,
      workspaceId,
    },
    include: {
      assignee: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      approvalRequests: {
        where: { status: 'PENDING' },
        take: 1,
      },
    },
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
  })
}
