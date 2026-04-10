import type { Prisma, WorkspaceMember, WorkspaceRole } from '@/lib/generated/prisma'
import { MembershipRepository } from './repository'
import { InviteRepository } from '@/modules/invite/repository'

export type ProvisionWorkspaceInviteInput = {
  userId: string
  workspaceId: string
  organizationId: string
  workspaceRole: WorkspaceRole
  existing: WorkspaceMember | null
  inviteId: string
  projectId?: string | null
  taskId?: string | null
}

type ScopeInput = {
  userId: string
  workspaceId: string
  projectId?: string | null
  taskId?: string | null
}

function computeInviteRestrictionFields(
  workspaceId: string,
  projectId?: string | null,
  taskId?: string | null,
  effectiveProjectFromTask?: string | null
): { restrictedProjectId: string | null; restrictedTaskId: string | null } {
  if (taskId) {
    return {
      restrictedTaskId: taskId,
      restrictedProjectId: effectiveProjectFromTask ?? projectId ?? null,
    }
  }
  if (projectId) {
    return { restrictedProjectId: projectId, restrictedTaskId: null }
  }
  return { restrictedProjectId: null, restrictedTaskId: null }
}

export class MembershipProvisioningService {
  static async applyProjectAndTaskScope(
    tx: Prisma.TransactionClient,
    input: ScopeInput
  ): Promise<void> {
    let effectiveProjectId = input.projectId ?? undefined
    if (input.taskId) {
      const t = await tx.task.findFirst({
        where: { id: input.taskId, workspaceId: input.workspaceId },
        select: { projectId: true },
      })
      if (t) {
        effectiveProjectId = t.projectId
      }
    }

    if (effectiveProjectId) {
      await MembershipRepository.upsertProjectMemberActive(tx, {
        userId: input.userId,
        projectId: effectiveProjectId,
        role: 'MEMBER',
      })
    }

    if (input.taskId) {
      await MembershipRepository.ensureTaskCollaborator(tx, {
        userId: input.userId,
        taskId: input.taskId,
        workspaceId: input.workspaceId,
      })
    }
  }

  /**
   * Project/task links only — for users who were already workspace members.
   */
  static async provisionInviteScopeOnly(
    tx: Prisma.TransactionClient,
    input: ScopeInput
  ): Promise<void> {
    await this.applyProjectAndTaskScope(tx, input)

    let effectiveProject = input.projectId ?? null
    if (input.taskId) {
      const t = await tx.task.findFirst({
        where: { id: input.taskId, workspaceId: input.workspaceId },
        select: { projectId: true },
      })
      if (t) effectiveProject = t.projectId
    }
    const r = computeInviteRestrictionFields(
      input.workspaceId,
      input.projectId,
      input.taskId,
      effectiveProject
    )
    await tx.workspaceMember.update({
      where: {
        userId_workspaceId: { userId: input.userId, workspaceId: input.workspaceId },
      },
      data: r,
    })
  }

  static async provisionWorkspaceInvite(
    tx: Prisma.TransactionClient,
    input: ProvisionWorkspaceInviteInput
  ): Promise<void> {
    await MembershipRepository.upsertOrganizationMemberActive(tx, {
      userId: input.userId,
      organizationId: input.organizationId,
    })

    let effectiveProject = input.projectId ?? null
    if (input.taskId) {
      const t = await tx.task.findFirst({
        where: { id: input.taskId, workspaceId: input.workspaceId },
        select: { projectId: true },
      })
      if (t) effectiveProject = t.projectId
    }
    const hasScope = Boolean(input.projectId || input.taskId)
    const restrictions = hasScope
      ? computeInviteRestrictionFields(
          input.workspaceId,
          input.projectId,
          input.taskId,
          effectiveProject
        )
      : { restrictedProjectId: null as string | null, restrictedTaskId: null as string | null }

    await MembershipRepository.applyWorkspaceRoleFromInvite(tx, {
      userId: input.userId,
      workspaceId: input.workspaceId,
      workspaceRole: input.workspaceRole,
      existing: input.existing,
      restrictedProjectId: restrictions.restrictedProjectId,
      restrictedTaskId: restrictions.restrictedTaskId,
    })

    await this.applyProjectAndTaskScope(tx, {
      userId: input.userId,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      taskId: input.taskId,
    })

    await InviteRepository.markAccepted(tx, input.inviteId)
  }
}
