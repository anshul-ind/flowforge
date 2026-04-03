import { prisma } from '@/lib/db'

/**
 * Get approval request with all related information
 */
export async function getApprovalWithRelations(
  approvalId: string,
  workspaceId: string
) {
  return prisma.approvalRequest.findFirst({
    where: { id: approvalId, workspaceId },
    include: {
      task: {
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
      },
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
  })
}

/**
 * Get pending approvals for a reviewer
 */
export async function getPendingApprovalsForReviewer(
  reviewerId: string,
  workspaceId: string
) {
  return prisma.approvalRequest.findMany({
    where: {
      workspaceId,
      reviewerId,
      status: 'PENDING',
    },
    include: {
      task: {
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
      },
      submitter: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })
}

/**
 * Get all approvals for a task
 */
export async function getApprovalsForTask(taskId: string, workspaceId: string) {
  return prisma.approvalRequest.findMany({
    where: {
      taskId,
      workspaceId,
    },
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
  })
}

/**
 * Get approval history for a workspace
 */
export async function getApprovalHistory(
  workspaceId: string,
  options?: {
    limit?: number
    offset?: number
    status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  }
) {
  return prisma.approvalRequest.findMany({
    where: {
      workspaceId,
      ...(options?.status && { status: options.status }),
    },
    include: {
      task: {
        include: {
          project: true,
        },
      },
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
    take: options?.limit || 50,
    skip: options?.offset || 0,
  })
}
