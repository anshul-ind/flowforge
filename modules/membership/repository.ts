import { prisma } from '@/lib/db'
import type { Prisma, WorkspaceMember, WorkspaceRole } from '@/lib/generated/prisma'

/**
 * Membership rows: org + workspace. Use `tx` inside transactions.
 */
export class MembershipRepository {
  static findWorkspaceMember(userId: string, workspaceId: string) {
    return prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    })
  }

  static upsertOrganizationMemberActive(
    tx: Prisma.TransactionClient,
    input: { userId: string; organizationId: string }
  ) {
    return tx.organizationMember.upsert({
      where: {
        userId_organizationId: {
          userId: input.userId,
          organizationId: input.organizationId,
        },
      },
      create: {
        userId: input.userId,
        organizationId: input.organizationId,
        role: 'MEMBER',
        status: 'ACTIVE',
      },
      update: { status: 'ACTIVE' },
    })
  }

  static applyWorkspaceRoleFromInvite(
    tx: Prisma.TransactionClient,
    input: {
      userId: string
      workspaceId: string
      workspaceRole: WorkspaceRole
      existing: WorkspaceMember | null
      restrictedProjectId?: string | null
      restrictedTaskId?: string | null
    }
  ) {
    const restrictionData = {
      restrictedProjectId: input.restrictedProjectId ?? null,
      restrictedTaskId: input.restrictedTaskId ?? null,
    }
    if (input.existing) {
      return tx.workspaceMember.update({
        where: { id: input.existing.id },
        data: {
          status: 'ACTIVE',
          role: input.existing.role === 'OWNER' ? input.existing.role : input.workspaceRole,
          ...restrictionData,
        },
      })
    }
    return tx.workspaceMember.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.userId,
        role: input.workspaceRole,
        status: 'ACTIVE',
        ...restrictionData,
      },
    })
  }

  static listActiveManagerUserIds(workspaceId: string) {
    return prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        role: { in: ['OWNER', 'MANAGER'] },
        status: 'ACTIVE',
      },
      select: { userId: true },
    })
  }

  static upsertProjectMemberActive(
    tx: Prisma.TransactionClient,
    input: { userId: string; projectId: string; role?: WorkspaceRole }
  ) {
    return tx.projectMember.upsert({
      where: {
        userId_projectId: { userId: input.userId, projectId: input.projectId },
      },
      create: {
        userId: input.userId,
        projectId: input.projectId,
        role: input.role ?? 'MEMBER',
        status: 'ACTIVE',
      },
      update: { status: 'ACTIVE' },
    })
  }

  /** Links user to task (join row + primary assignee if unset). */
  static async ensureTaskCollaborator(
    tx: Prisma.TransactionClient,
    input: { userId: string; taskId: string; workspaceId: string }
  ): Promise<void> {
    await tx.taskAssignee.upsert({
      where: {
        taskId_userId: { taskId: input.taskId, userId: input.userId },
      },
      create: { taskId: input.taskId, userId: input.userId },
      update: {},
    })

    const task = await tx.task.findFirst({
      where: { id: input.taskId, workspaceId: input.workspaceId },
      select: { assigneeId: true },
    })
    if (task && !task.assigneeId) {
      await tx.task.update({
        where: { id: input.taskId },
        data: { assigneeId: input.userId },
      })
    }
  }
}
