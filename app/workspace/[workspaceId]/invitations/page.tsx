import Link from 'next/link'
import { requireUser } from '@/lib/auth/require-user'
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant'
import { ForbiddenError } from '@/lib/errors'
import { canInvite } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { InviteRevokeRow } from '@/components/workspace/invite-revoke-row'

export default async function WorkspaceInvitationsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params
  const user = await requireUser()
  const tenant = await resolveTenantContext(workspaceId, user.id)

  if (!tenant) {
    throw new ForbiddenError('Workspace access denied')
  }

  if (!canInvite(tenant.role)) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Invitations</h1>
        <p className="text-gray-600">Only owners and managers can manage invitations.</p>
        <Link href={`/workspace/${workspaceId}/members`} className="text-sm font-medium text-blue-600">
          ← Back to members
        </Link>
      </div>
    )
  }

  const invites = await prisma.workspaceInvite.findMany({
    where: {
      workspaceId,
      status: 'PENDING',
      revokedAt: null,
    },
    include: {
      project: { select: { title: true } },
      task: { select: { title: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const rows = invites.map((i) => ({
    id: i.id,
    email: i.email,
    workspaceRole: i.workspaceRole,
    expiresAt: i.expiresAt,
    createdAt: i.createdAt,
    projectTitle: i.project?.title ?? null,
    taskTitle: i.task?.title ?? null,
  }))

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href={`/workspace/${workspaceId}/members`}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            ← Members
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Pending invitations</h1>
          <p className="mt-1 text-gray-600">
            Revoke a link or email invite before it is accepted. Expired invites stay listed until you
            revoke or they expire.
          </p>
        </div>
        <Link
          href={`/workspace/${workspaceId}/members/invite`}
          className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900"
        >
          New invite
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600">
          No pending invitations.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Email / link</th>
                <th className="px-4 py-3">Scope</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <InviteRevokeRow key={row.id} workspaceId={workspaceId} invite={row} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
