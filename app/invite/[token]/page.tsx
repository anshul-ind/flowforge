import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { InviteAcceptForm } from '@/components/workspace/invite-accept-form'

interface InvitePageProps {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params
  const session = await auth()

  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    include: { workspace: { select: { id: true, name: true } } },
  })

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

  if (invite.acceptedAt) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Invitation already used</h1>
        <p className="mt-2 text-sm text-gray-600">
          This invite has already been accepted.
        </p>
        <Link
          href={`/workspace/${invite.workspaceId}`}
          className="mt-6 inline-block text-sm font-medium text-blue-600"
        >
          Open workspace
        </Link>
      </div>
    )
  }

  if (invite.expiresAt < new Date()) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Invitation expired</h1>
        <p className="mt-2 text-sm text-gray-600">
          Ask an admin to send you a new invitation.
        </p>
        <Link href="/sign-in" className="mt-6 inline-block text-sm font-medium text-blue-600">
          Sign in
        </Link>
      </div>
    )
  }

  const roleLabel = invite.role.toLowerCase()

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-gray-900">Join workspace</h1>
      <p className="mt-2 text-gray-600">
        You&apos;ve been invited to <strong>{invite.workspace.name}</strong> as a{' '}
        <strong>{roleLabel}</strong>.
        {invite.email && (
          <>
            {' '}
            This invite is for <strong>{invite.email}</strong>.
          </>
        )}
      </p>

      {!session?.user?.id ? (
        <div className="mt-8 space-y-4">
          <p className="text-sm text-gray-600">Sign in or create an account to accept.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/sign-in?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}
              className="rounded-lg bg-black px-4 py-2 text-center text-sm font-semibold text-white hover:bg-gray-900"
            >
              Sign in
            </Link>
            <Link
              href={`/sign-up?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}
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
          <InviteAcceptForm token={token} />
        </div>
      )}
    </div>
  )
}
