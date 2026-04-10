import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { hashInviteToken } from '@/lib/invite/token-hash'
import { InviteAcceptForm } from '@/components/workspace/invite-accept-form'

/** Public callback for auth (token stays in query string for new links). */
export function inviteAuthCallbackUrl(rawToken: string): string {
  return `/invite/accept?token=${encodeURIComponent(rawToken.trim())}`
}

export async function InviteFlow({
  token,
  inviteError,
}: {
  token: string
  inviteError?: string
}) {
  const session = await auth()
  const trimmed = token.trim()
  if (!trimmed) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Invalid invitation</h1>
        <p className="mt-2 text-sm text-gray-600">This link is missing a token.</p>
        <Link href="/sign-in" className="mt-6 inline-block text-sm font-medium text-blue-600">
          Sign in
        </Link>
      </div>
    )
  }

  let invite
  try {
    invite = await prisma.invite.findUnique({
      where: { tokenHash: hashInviteToken(trimmed) },
      include: {
        workspace: { select: { id: true, name: true } },
        project: { select: { id: true, title: true } },
        task: { select: { id: true, title: true } },
      },
    })
  } catch (err) {
    console.error('[InviteFlow] Database error loading invite', err)
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-gray-600">
          We could not load this invitation. Check your connection, try again in a moment, or ask for a
          new link.
        </p>
        <Link href="/sign-in" className="mt-6 inline-block text-sm font-medium text-blue-600">
          Sign in
        </Link>
      </div>
    )
  }

  if (!invite) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Invalid invitation</h1>
        <p className="mt-2 text-sm text-gray-600">
          This link is not valid. Ask your workspace admin for a new invite.
        </p>
        <Link href="/sign-in" className="mt-6 inline-block text-sm font-medium text-blue-600">
          Sign in
        </Link>
      </div>
    )
  }

  if (invite.status === 'REVOKED') {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Invitation revoked</h1>
        <p className="mt-2 text-sm text-gray-600">This invite is no longer active.</p>
        <Link href="/sign-in" className="mt-6 inline-block text-sm font-medium text-blue-600">
          Sign in
        </Link>
      </div>
    )
  }

  const expired =
    invite.status === 'EXPIRED' || (invite.status === 'PENDING' && invite.expiresAt < new Date())

  if (expired) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Invitation expired</h1>
        <p className="mt-2 text-sm text-gray-600">Ask an admin to send you a new invitation.</p>
        <Link href="/sign-in" className="mt-6 inline-block text-sm font-medium text-blue-600">
          Sign in
        </Link>
      </div>
    )
  }

  if (invite.status === 'ACCEPTED' || invite.acceptedAt) {
    const wsId = invite.workspaceId
    let canOpenWorkspace = false
    if (session?.user?.id && wsId) {
      const member = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: { userId: session.user.id, workspaceId: wsId },
        },
        select: { status: true },
      })
      canOpenWorkspace = member?.status === 'ACTIVE'
    }

    const signInHref = wsId
      ? `/sign-in?callbackUrl=${encodeURIComponent(`/workspace/${wsId}`)}`
      : '/sign-in'

    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Invitation already used</h1>
        <p className="mt-2 text-sm text-gray-600">This invite has already been accepted.</p>
        {wsId && canOpenWorkspace ? (
          <Link
            href={`/workspace/${wsId}`}
            className="mt-6 inline-block text-sm font-medium text-blue-600"
          >
            Open workspace
          </Link>
        ) : wsId && session?.user?.id ? (
          <p className="mt-6 text-sm text-gray-600">
            You&apos;re signed in with an account that doesn&apos;t have access to this workspace. Sign
            out and sign in with the invited email, or ask an admin for a new invite.
          </p>
        ) : wsId ? (
          <Link href={signInHref} className="mt-6 inline-block text-sm font-medium text-blue-600">
            Sign in to open workspace
          </Link>
        ) : (
          <Link href="/sign-in" className="mt-6 inline-block text-sm font-medium text-blue-600">
            Sign in
          </Link>
        )}
      </div>
    )
  }

  if (!invite.workspaceId || !invite.workspace) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Invalid invitation</h1>
        <p className="mt-2 text-sm text-gray-600">The workspace for this invite no longer exists.</p>
        <Link href="/sign-in" className="mt-6 inline-block text-sm font-medium text-blue-600">
          Sign in
        </Link>
      </div>
    )
  }

  const role = invite.workspaceRole ?? 'MEMBER'
  const roleLabel = role.toLowerCase().replaceAll('_', ' ')
  const cb = inviteAuthCallbackUrl(trimmed)
  const scopedToTask = Boolean(invite.taskId && invite.task)
  const scopedToProjectOnly = Boolean(invite.projectId && invite.project && !invite.taskId)

  const scopeLine = scopedToTask
    ? `You will get assignee-style access to the task "${invite.task!.title}" in ${invite.workspace.name}.`
    : scopedToProjectOnly
      ? `You will get access to the project "${invite.project!.title}" in ${invite.workspace.name}.`
      : null

  const heading =
    scopedToTask || scopedToProjectOnly ? "You're invited to collaborate" : 'Join as a team member'

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      {inviteError ? (
        <div
          className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {inviteError}
        </div>
      ) : null}
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">FlowForge invitation</p>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">{heading}</h1>
      <p className="mt-2 text-gray-600">
        {scopeLine ? (
          <>
            {scopeLine}{' '}
            Your workspace role is <strong>{roleLabel}</strong>.
          </>
        ) : (
          <>
            You&apos;ve been invited to <strong>{invite.workspace.name}</strong> as a{' '}
            <strong>{roleLabel}</strong>.
          </>
        )}
        {invite.email ? (
          <>
            {' '}
            This invite is for <strong>{invite.email}</strong>.
          </>
        ) : null}
      </p>

      {!session?.user?.id ? (
        <div className="mt-8 space-y-4">
          <p className="text-sm text-gray-600">
            Sign in with your FlowForge account to review and accept this invite. You&apos;ll return here
            automatically after signing in.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/sign-in?callbackUrl=${encodeURIComponent(cb)}`}
              className="rounded-lg bg-black px-4 py-2 text-center text-sm font-semibold text-white hover:bg-gray-900"
            >
              Sign in to continue
            </Link>
            <Link
              href={`/sign-up?callbackUrl=${encodeURIComponent(cb)}`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Create account
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <p className="text-sm text-gray-600 mb-4">
            Signed in as <strong>{session.user.email ?? session.user.id}</strong>
          </p>
          <InviteAcceptForm token={trimmed} />
        </div>
      )}
    </div>
  )
}
