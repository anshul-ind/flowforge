'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { requireInvitePermission, requireWorkspaceAccess } from '@/lib/authz'
import { inviteMemberSchema } from '@/lib/validation/invite'
import { sendInviteEmail, isMailConfigured } from '@/lib/mail'
import { createAuditLog } from '@/lib/audit'
import { createNotification } from '@/lib/notifications'
import { inviteLimiter } from '@/lib/rate-limiting/rate-limiter'
import { revalidatePath } from 'next/cache'
import { ForbiddenError } from '@/lib/errors'
import { resolveAppBaseUrl } from '@/lib/invite/app-base-url'
import { OrganizationRepository } from '@/modules/organization/repository'
import { InviteService } from '@/modules/invite/service'
import { buildInviteAcceptUrl } from '@/modules/invite/build-invite-url'
import { MembershipRepository } from '@/modules/membership/repository'
import { computeInviteAcceptNextPath } from '@/lib/invite/post-accept-redirect'

type InviteActionState =
  | { ok: true; inviteUrl: string; emailSent?: boolean; emailError?: string }
  | {
      ok: false
      error: string
      details?: { fieldErrors: Record<string, string[] | undefined> }
    }

async function assertInviteResources(
  workspaceId: string,
  scope: 'workspace' | 'project' | 'task',
  projectId?: string,
  taskId?: string
): Promise<string | null> {
  if (scope === 'project' && projectId) {
    const p = await prisma.project.findFirst({
      where: { id: projectId, workspaceId },
      select: { id: true },
    })
    if (!p) return 'That project is not in this workspace.'
  }
  if (scope === 'task' && taskId) {
    const t = await prisma.task.findFirst({
      where: { id: taskId, workspaceId },
      select: { id: true },
    })
    if (!t) return 'That task is not in this workspace.'
  }
  return null
}

export async function createWorkspaceInviteAction(
  _prev: unknown,
  formData: FormData
): Promise<InviteActionState> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { ok: false, error: 'Unauthorized' }
    }

    const parsed = inviteMemberSchema.safeParse({
      workspaceId: formData.get('workspaceId') ?? undefined,
      email: formData.get('email') ?? undefined,
      role: formData.get('role') ?? undefined,
      mode: formData.get('mode') ?? undefined,
      inviteScope: formData.get('inviteScope') ?? undefined,
      projectId: formData.get('projectId') ?? undefined,
      taskId: formData.get('taskId') ?? undefined,
    })

    if (!parsed.success) {
      const flat = parsed.error.flatten()
      return {
        ok: false,
        error: 'Validation failed',
        details: { fieldErrors: flat.fieldErrors },
      }
    }

    const { workspaceId, email, role, mode, inviteScope, projectId, taskId } = parsed.data
    const normalizedEmail = email?.toLowerCase().trim()

    const resourceErr = await assertInviteResources(
      workspaceId,
      inviteScope,
      projectId,
      taskId
    )
    if (resourceErr) {
      return { ok: false, error: resourceErr }
    }

    let storeProjectId: string | null = null
    let storeTaskId: string | null = null
    let workspaceRole = role
    if (inviteScope === 'workspace') {
      storeProjectId = null
      storeTaskId = null
    } else if (inviteScope === 'project') {
      storeProjectId = projectId ?? null
      storeTaskId = null
    } else {
      storeTaskId = taskId ?? null
      storeProjectId = null
      workspaceRole = 'TASK_ASSIGNEE'
    }

    try {
      requireInvitePermission(
        await requireWorkspaceAccess(session.user.id, workspaceId)
      )
    } catch (e) {
      if (e instanceof ForbiddenError) {
        return { ok: false, error: e.message }
      }
      throw e
    }

    const workspace = await OrganizationRepository.findWorkspaceTenantSummary(workspaceId)
    if (!workspace) {
      return { ok: false, error: 'Workspace not found' }
    }

    if (mode === 'email' && normalizedEmail && inviteScope === 'workspace') {
      const conflict = await InviteService.hasActiveWorkspaceMember(normalizedEmail, workspaceId)
      if (conflict) {
        return { ok: false, error: 'This user is already an active member' }
      }
    }

    const limitResult = inviteLimiter.check(workspaceId)
    if (!limitResult.allowed) {
      return {
        ok: false,
        error: 'Too many invitations from this workspace. Try again later.',
      }
    }

    const inviteEmail = mode === 'email' && normalizedEmail ? normalizedEmail : ''

    const { invite, rawToken } = await InviteService.createWorkspaceInvite({
      workspaceId,
      organizationId: workspace.organizationId,
      invitedByUserId: session.user.id,
      workspaceRole,
      email: inviteEmail,
      projectId: storeProjectId,
      taskId: storeTaskId,
    })

    const inviteUrl = buildInviteAcceptUrl(await resolveAppBaseUrl(), rawToken)

    let emailSent: boolean | undefined
    let emailError: string | undefined

    let emailScopeNote: string | undefined
    if (inviteScope === 'task' && storeTaskId) {
      const t = await prisma.task.findFirst({
        where: { id: storeTaskId, workspaceId },
        select: { title: true },
      })
      if (t) {
        emailScopeNote = `This invitation is scoped to the task "${t.title}".`
      }
    } else if (inviteScope === 'project' && storeProjectId) {
      const p = await prisma.project.findFirst({
        where: { id: storeProjectId, workspaceId },
        select: { title: true },
      })
      if (p) {
        emailScopeNote = `This invitation is scoped to the project "${p.title}".`
      }
    }

    if (mode === 'email' && normalizedEmail) {
      if (!isMailConfigured()) {
        emailSent = false
        emailError = 'Email was not sent — configure SMTP or share the link manually.'
      } else {
        const sent = await sendInviteEmail(normalizedEmail, inviteUrl, workspace.name, {
          scopeNote: emailScopeNote,
        })
        if (sent.ok) {
          emailSent = true
        } else {
          emailSent = false
          emailError = sent.error
        }
      }
    }

    await createAuditLog({
      workspaceId,
      userId: session.user.id,
      action: 'MEMBER_INVITED',
      entityType: 'invite',
      entityId: invite.id,
      details: JSON.stringify({
        mode,
        email: normalizedEmail ?? null,
        role: workspaceRole,
        inviteScope,
        projectId: storeProjectId,
        taskId: storeTaskId,
        emailSent: emailSent ?? null,
      }),
    })

    revalidatePath(`/workspace/${workspaceId}/members`)
    revalidatePath(`/workspace/${workspaceId}/members/invite`)
    revalidatePath(`/workspace/${workspaceId}/invitations`)

    return {
      ok: true,
      inviteUrl,
      emailSent,
      emailError,
    }
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return { ok: false, error: e.message }
    }
    console.error('[createWorkspaceInviteAction]', e)
    return { ok: false, error: 'Failed to create invitation' }
  }
}

async function resolveSessionEmail(userId: string, sessionEmail?: string | null) {
  if (sessionEmail) return sessionEmail.toLowerCase().trim()
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })
  return u?.email?.toLowerCase().trim() ?? null
}

export async function acceptInviteByToken(
  token: string
): Promise<
  | { ok: true; workspaceId: string; nextPath: string; alreadyMember?: boolean }
  | { ok: false; error: string }
> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'You must be signed in to accept an invitation' }
  }

  const userEmail = await resolveSessionEmail(session.user.id, session.user.email)
  if (!userEmail) {
    return { ok: false, error: 'Your account has no email on file' }
  }

  const result = await InviteService.acceptWorkspaceInvite({
    rawToken: token,
    userId: session.user.id,
    userEmailNormalized: userEmail,
  })

  if (!result.ok) {
    return result
  }

  const {
    workspaceId,
    alreadyMember,
    scopeOnlyProvisioned,
    inviteId,
    workspaceName,
    roleApplied,
    inviteProjectId,
    inviteTaskId,
  } = result

  const nextPath = await computeInviteAcceptNextPath(
    workspaceId,
    inviteProjectId,
    inviteTaskId
  )

  if (!alreadyMember || scopeOnlyProvisioned) {
    await createAuditLog({
      workspaceId,
      userId: session.user.id,
      action: 'INVITE_ACCEPTED',
      entityType: 'invite',
      entityId: inviteId,
      details: JSON.stringify({
        role: roleApplied,
        scopeOnly: scopeOnlyProvisioned ?? false,
      }),
    })

    const managers = await MembershipRepository.listActiveManagerUserIds(workspaceId)
    const notifyIds = new Set(managers.map((m) => m.userId))
    notifyIds.delete(session.user.id)

    const joinedMsg = scopeOnlyProvisioned
      ? `${userEmail} accepted a scoped invitation in ${workspaceName ?? 'the workspace'}`
      : `${userEmail} joined ${workspaceName ?? 'the workspace'}`

    await Promise.all(
      [...notifyIds].map((userId) =>
        createNotification({
          userId,
          workspaceId,
          type: 'INVITE_ACCEPTED',
          message: joinedMsg,
          entityType: 'workspace',
          entityId: workspaceId,
        })
      )
    )
  }

  revalidatePath('/workspace')
  revalidatePath(`/workspace/${workspaceId}`)
  revalidatePath(`/workspace/${workspaceId}/members`)

  return { ok: true, workspaceId, nextPath, alreadyMember }
}

export type RevokeInviteState =
  | { ok: true }
  | { ok: false; error: string }

export async function revokeWorkspaceInviteAction(
  _prev: RevokeInviteState | null,
  formData: FormData
): Promise<RevokeInviteState> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Unauthorized' }
  }

  const workspaceId = String(formData.get('workspaceId') ?? '').trim()
  const inviteId = String(formData.get('inviteId') ?? '').trim()
  if (!workspaceId || !inviteId) {
    return { ok: false, error: 'Missing workspace or invitation' }
  }

  try {
    requireInvitePermission(await requireWorkspaceAccess(session.user.id, workspaceId))
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return { ok: false, error: e.message }
    }
    throw e
  }

  const invite = await prisma.workspaceInvite.findFirst({
    where: { id: inviteId, workspaceId },
  })
  if (!invite) {
    return { ok: false, error: 'Invitation not found' }
  }
  if (invite.status !== 'PENDING') {
    return { ok: false, error: 'Only pending invitations can be revoked' }
  }
  if (invite.revokedAt) {
    return { ok: false, error: 'This invitation was already revoked' }
  }

  await prisma.workspaceInvite.update({
    where: { id: inviteId },
    data: { status: 'REVOKED', revokedAt: new Date() },
  })

  await createAuditLog({
    workspaceId,
    userId: session.user.id,
    action: 'INVITE_REVOKED',
    entityType: 'invite',
    entityId: inviteId,
    details: JSON.stringify({ email: invite.email }),
  })

  revalidatePath(`/workspace/${workspaceId}/invitations`)
  revalidatePath(`/workspace/${workspaceId}/members`)

  return { ok: true }
}
