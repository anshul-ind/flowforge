'use server'

import { randomUUID } from 'crypto'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { requireWorkspaceMember } from '@/lib/workspace'
import { canInvite } from '@/lib/permissions'
import { inviteMemberSchema } from '@/lib/validation/invite'
import { sendInviteEmail, isMailConfigured } from '@/lib/mail'
import { createAuditLog } from '@/lib/audit'
import { createNotification } from '@/lib/notifications'
import { inviteLimiter } from '@/lib/rate-limiting/rate-limiter'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { ForbiddenError } from '@/lib/errors'

const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7

async function appBaseUrl(): Promise<string> {
  // Prefer explicit env config when provided (common in production/hosting).
  const baseFromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (baseFromEnv) return baseFromEnv

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`

  // Server Actions run inside a request context; derive the public origin from headers.
  // This prevents invite emails from hardcoding `localhost` when env vars are missing.
  const h = await headers()
  const origin = h.get('origin')?.trim()
  if (origin) return origin.replace(/\/$/, '')

  const proto =
    h.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
    h.get('x-forwarded-protocol')?.split(',')[0]?.trim() ||
    'http'
  const host =
    h.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    h.get('host')?.trim()

  if (host) return `${proto}://${host}`.replace(/\/$/, '')

  // Dev fallback (only used when we cannot infer origin).
  console.warn('[invite-workflow] Could not determine app base URL; using localhost fallback')
  return 'http://localhost:3000'
}

type InviteActionState =
  | { ok: true; inviteUrl: string; emailSent?: boolean; emailError?: string }
  | {
      ok: false
      error: string
      details?: { fieldErrors: Record<string, string[] | undefined> }
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
      workspaceId: formData.get('workspaceId'),
      email: formData.get('email') ?? undefined,
      role: formData.get('role'),
      mode: formData.get('mode'),
    })

    if (!parsed.success) {
      const flat = parsed.error.flatten()
      return {
        ok: false,
        error: 'Validation failed',
        details: { fieldErrors: flat.fieldErrors },
      }
    }

    const { workspaceId, email, role, mode } = parsed.data
    const normalizedEmail = email?.toLowerCase().trim()

    const membership = await requireWorkspaceMember(session.user.id, workspaceId)
    if (!canInvite(membership.role)) {
      return { ok: false, error: 'You do not have permission to invite members' }
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    })
    if (!workspace) {
      return { ok: false, error: 'Workspace not found' }
    }

    if (mode === 'email' && normalizedEmail) {
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      })
      if (existingUser) {
        const already = await prisma.workspaceMember.findUnique({
          where: {
            userId_workspaceId: {
              userId: existingUser.id,
              workspaceId,
            },
          },
        })
        if (already?.status === 'ACTIVE') {
          return { ok: false, error: 'This user is already an active member' }
        }
      }
    }

    const limitResult = inviteLimiter.check(workspaceId)
    if (!limitResult.allowed) {
      return {
        ok: false,
        error: 'Too many invitations from this workspace. Try again later.',
      }
    }

    const token = randomUUID()
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS)

    const invite = await prisma.workspaceInvite.create({
      data: {
        workspaceId,
        email: mode === 'email' ? normalizedEmail ?? null : null,
        role,
        token,
        invitedById: session.user.id,
        expiresAt,
      },
    })

    const inviteUrl = `${await appBaseUrl()}/invite/${invite.token}`

    let emailSent: boolean | undefined
    let emailError: string | undefined

    if (mode === 'email' && normalizedEmail) {
      if (!isMailConfigured()) {
        emailSent = false
        emailError = 'Email was not sent — configure SMTP or share the link manually.'
      } else {
        const sent = await sendInviteEmail(normalizedEmail, inviteUrl, workspace.name)
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
      entityType: 'workspace_invite',
      entityId: invite.id,
      details: JSON.stringify({
        mode,
        email: normalizedEmail ?? null,
        role,
        emailSent: emailSent ?? null,
      }),
    })

    revalidatePath(`/workspace/${workspaceId}/members`)
    revalidatePath(`/workspace/${workspaceId}/members/invite`)

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
  | { ok: true; workspaceId: string; alreadyMember?: boolean }
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

  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    include: { workspace: true },
  })

  if (!invite) {
    return { ok: false, error: 'Invalid or expired invitation' }
  }

  if (invite.acceptedAt) {
    return { ok: true, workspaceId: invite.workspaceId, alreadyMember: true }
  }

  if (invite.expiresAt < new Date()) {
    return { ok: false, error: 'This invitation has expired' }
  }

  if (invite.email && invite.email.toLowerCase() !== userEmail) {
    return {
      ok: false,
      error: 'This invitation was sent to a different email address',
    }
  }

  const existing = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId: invite.workspaceId,
      },
    },
  })

  if (existing?.status === 'ACTIVE') {
    await prisma.workspaceInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    })
    return { ok: true, workspaceId: invite.workspaceId, alreadyMember: true }
  }

  if (existing?.status === 'SUSPENDED') {
    return { ok: false, error: 'Your access to this workspace is suspended' }
  }

  await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.workspaceMember.update({
        where: { id: existing.id },
        data: {
          status: 'ACTIVE',
          role: existing.role === 'OWNER' ? existing.role : invite.role,
        },
      })
    } else {
      await tx.workspaceMember.create({
        data: {
          workspaceId: invite.workspaceId,
          userId: session.user.id,
          role: invite.role,
          status: 'ACTIVE',
        },
      })
    }

    await tx.workspaceInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    })
  })

  await createAuditLog({
    workspaceId: invite.workspaceId,
    userId: session.user.id,
    action: 'INVITE_ACCEPTED',
    entityType: 'workspace_invite',
    entityId: invite.id,
    details: JSON.stringify({ role: invite.role }),
  })

  const managers = await prisma.workspaceMember.findMany({
    where: {
      workspaceId: invite.workspaceId,
      role: { in: ['OWNER', 'MANAGER'] },
      status: 'ACTIVE',
    },
    select: { userId: true },
  })

  const notifyIds = new Set(managers.map((m) => m.userId))
  notifyIds.delete(session.user.id)

  await Promise.all(
    [...notifyIds].map((userId) =>
      createNotification({
        userId,
        workspaceId: invite.workspaceId,
        type: 'INVITE_ACCEPTED',
        message: `${userEmail} joined ${invite.workspace.name}`,
        entityType: 'workspace',
        entityId: invite.workspaceId,
      })
    )
  )

  revalidatePath('/workspace')
  revalidatePath(`/workspace/${invite.workspaceId}`)
  revalidatePath(`/workspace/${invite.workspaceId}/members`)

  return { ok: true, workspaceId: invite.workspaceId }
}
