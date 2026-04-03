import type { AuditAction } from '@/lib/generated/prisma'
import { prisma } from './db'

export {
  createAuditLog,
  type CreateAuditLogInput,
} from './audit/create-audit-log'
import { createAuditLog } from './audit/create-audit-log'

/**
 * Get audit logs for a workspace
 */
export async function getWorkspaceAuditLogs(
  workspaceId: string,
  options?: {
    limit?: number
    offset?: number
    entityType?: string
    action?: AuditAction
  }
) {
  try {
    return await prisma.auditLog.findMany({
      where: {
        workspaceId,
        ...(options?.entityType && { entityType: options.entityType }),
        ...(options?.action && { action: options.action }),
      },
      include: {
        user: {
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
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
    return []
  }
}

/**
 * Log task creation
 */
export async function logTaskCreation(
  workspaceId: string,
  userId: string,
  taskId: string,
  projectId: string
) {
  return createAuditLog({
    workspaceId,
    userId,
    action: 'TASK_CREATED',
    entityType: 'task',
    entityId: taskId,
    details: `Created task in project ${projectId}`,
  })
}

/**
 * Log task submission for approval
 */
export async function logTaskApprovalSubmission(
  workspaceId: string,
  userId: string,
  approvalId: string,
  taskId: string
) {
  return createAuditLog({
    workspaceId,
    userId,
    action: 'APPROVAL_SUBMITTED',
    entityType: 'approval',
    entityId: approvalId,
    details: `Submitted task ${taskId} for approval`,
  })
}

/**
 * Log approval approval
 */
export async function logApprovalApproved(
  workspaceId: string,
  userId: string,
  approvalId: string,
  taskId: string
) {
  return createAuditLog({
    workspaceId,
    userId,
    action: 'APPROVAL_APPROVED',
    entityType: 'approval',
    entityId: approvalId,
    details: `Approved task ${taskId}`,
  })
}

/**
 * Log approval rejection
 */
export async function logApprovalRejected(
  workspaceId: string,
  userId: string,
  approvalId: string,
  taskId: string,
  rejectionReason: string
) {
  return createAuditLog({
    workspaceId,
    userId,
    action: 'APPROVAL_REJECTED',
    entityType: 'approval',
    entityId: approvalId,
    details: `Rejected task ${taskId}: ${rejectionReason}`,
  })
}
