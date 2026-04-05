import { prisma } from '@/lib/db'
import type { WorkspaceInvite, WorkspaceRole } from '@/lib/generated/prisma'
import { generateInviteRawToken, hashInviteToken } from '@/lib/invite/token-hash'
import { InviteRepository } from './repository'
import { MembershipRepository } from '@/modules/membership/repository'
import { MembershipProvisioningService } from '@/modules/membership/service'

const DEFAULT_INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7

export type CreateWorkspaceInviteParams = {
  workspaceId: string
  organizationId: string
  invitedByUserId: string
  workspaceRole: WorkspaceRole
  email: string
  expiresAt?: Date
  projectId?: string | null
  taskId?: string | null
}

export type CreateWorkspaceInviteResult = {
  invite: WorkspaceInvite
  rawToken: string
}

export type AcceptWorkspaceInviteResult =
  | {
      ok: true
      workspaceId: string
      alreadyMember?: boolean
      /** True when an existing workspace member gained project/task scope from this accept. */
      scopeOnlyProvisioned?: boolean
      inviteId: string
      workspaceName: string | null
      roleApplied: WorkspaceRole
      /** From invite row — used for post-accept deep link. */
      inviteProjectId?: string | null
      inviteTaskId?: string | null
    }
  | { ok: false; error: string }

export class InviteService {
  static async createWorkspaceInvite(
    params: CreateWorkspaceInviteParams
  ): Promise<CreateWorkspaceInviteResult> {
    const rawToken = generateInviteRawToken()
    const tokenHash = hashInviteToken(rawToken)
    const expiresAt = params.expiresAt ?? new Date(Date.now() + DEFAULT_INVITE_TTL_MS)

    const invite = await InviteRepository.create({
      email: params.email,
      tokenHash,
      status: 'PENDING',
      organizationId: params.organizationId,
      workspaceId: params.workspaceId,
      projectId: params.projectId ?? undefined,
      taskId: params.taskId ?? undefined,
      workspaceRole: params.workspaceRole,
      invitedByUserId: params.invitedByUserId,
      expiresAt,
    })

    return { invite, rawToken }
  }

  static async hasActiveWorkspaceMember(email: string, workspaceId: string): Promise<boolean> {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
    if (!existingUser) return false

    const already = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: existingUser.id,
          workspaceId,
        },
      },
    })
    return already?.status === 'ACTIVE'
  }

  static async acceptWorkspaceInvite(input: {
    rawToken: string
    userId: string
    userEmailNormalized: string
  }): Promise<AcceptWorkspaceInviteResult> {
    const trimmed = input.rawToken.trim()
    if (!trimmed) {
      return { ok: false, error: 'Invalid invitation' }
    }

    const invite = await InviteRepository.findByTokenHashForAccept(hashInviteToken(trimmed))
    if (!invite) {
      return { ok: false, error: 'Invalid or expired invitation' }
    }

    if (invite.status === 'REVOKED') {
      return { ok: false, error: 'This invitation has been revoked' }
    }

    if (!invite.workspaceId || !invite.workspace) {
      return { ok: false, error: 'This invitation is no longer valid' }
    }

    const workspaceId = invite.workspaceId
    const organizationId = invite.workspace.organizationId
    const projectId = invite.projectId
    const taskId = invite.taskId

    if (invite.status === 'ACCEPTED' || invite.acceptedAt) {
      const member = await MembershipRepository.findWorkspaceMember(input.userId, workspaceId)
      if (member?.status === 'ACTIVE') {
        return {
          ok: true,
          workspaceId,
          alreadyMember: true,
          inviteId: invite.id,
          workspaceName: invite.workspace.name,
          roleApplied: invite.workspaceRole ?? 'MEMBER',
          inviteProjectId: invite.projectId,
          inviteTaskId: invite.taskId,
        }
      }
      return { ok: false, error: 'This invitation is no longer valid' }
    }

    if (invite.status === 'EXPIRED' || invite.expiresAt < new Date()) {
      return { ok: false, error: 'This invitation has expired' }
    }

    if (invite.status !== 'PENDING') {
      return { ok: false, error: 'Invalid or expired invitation' }
    }

    if (invite.email && invite.email.toLowerCase() !== input.userEmailNormalized) {
      return {
        ok: false,
        error: 'This invitation was sent to a different email address',
      }
    }

    const roleToApply = invite.workspaceRole ?? 'MEMBER'
    const existing = await MembershipRepository.findWorkspaceMember(input.userId, workspaceId)

    const hasScope = !!(projectId || taskId)

    if (existing?.status === 'ACTIVE') {
      if (hasScope) {
        await prisma.$transaction(async (tx) => {
          await MembershipProvisioningService.provisionInviteScopeOnly(tx, {
            userId: input.userId,
            workspaceId,
            projectId,
            taskId,
          })
          await InviteRepository.markAccepted(tx, invite.id)
        })
        return {
          ok: true,
          workspaceId,
          alreadyMember: true,
          scopeOnlyProvisioned: true,
          inviteId: invite.id,
          workspaceName: invite.workspace.name,
          roleApplied: roleToApply,
          inviteProjectId: invite.projectId,
          inviteTaskId: invite.taskId,
        }
      }
      await InviteRepository.markAcceptedOutsideTx(invite.id)
      return {
        ok: true,
        workspaceId,
        alreadyMember: true,
        inviteId: invite.id,
        workspaceName: invite.workspace.name,
        roleApplied: roleToApply,
        inviteProjectId: invite.projectId,
        inviteTaskId: invite.taskId,
      }
    }

    if (existing?.status === 'SUSPENDED') {
      return { ok: false, error: 'Your access to this workspace is suspended' }
    }

    await prisma.$transaction(async (tx) => {
      await MembershipProvisioningService.provisionWorkspaceInvite(tx, {
        userId: input.userId,
        workspaceId,
        organizationId,
        workspaceRole: roleToApply,
        existing,
        inviteId: invite.id,
        projectId,
        taskId,
      })
    })

    return {
      ok: true,
      workspaceId,
      inviteId: invite.id,
      workspaceName: invite.workspace.name,
      roleApplied: roleToApply,
      inviteProjectId: invite.projectId,
      inviteTaskId: invite.taskId,
    }
  }
}
