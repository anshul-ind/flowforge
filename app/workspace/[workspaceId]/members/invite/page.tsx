import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth/require-user'
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant'
import { isScopedInviteMember } from '@/lib/tenant/invite-restriction'
import { ForbiddenError } from '@/lib/errors'
import { canInvite } from '@/lib/permissions'
import { WorkspaceInviteForm } from '@/components/workspace/workspace-invite-form'
import { prisma } from '@/lib/db'

export default async function MembersInvitePage({
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

  if (isScopedInviteMember(tenant)) {
    notFound()
  }

  if (!canInvite(tenant.role)) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Invite members</h1>
        <p className="text-gray-600">Only owners and managers can invite people.</p>
        <Link href={`/workspace/${workspaceId}/members`} className="text-sm font-medium text-blue-600">
          ← Back to members
        </Link>
      </div>
    )
  }

  const [projects, tasks] = await Promise.all([
    prisma.project.findMany({
      where: { workspaceId },
      select: { id: true, title: true },
      orderBy: { updatedAt: 'desc' },
      take: 80,
    }),
    prisma.task.findMany({
      where: { workspaceId },
      select: { id: true, title: true, projectId: true },
      orderBy: { updatedAt: 'desc' },
      take: 150,
    }),
  ])

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          href={`/workspace/${workspaceId}/members`}
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← Members
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Invite people</h1>
        <p className="mt-1 text-gray-600">
          Send an email invitation or create a shareable link. Links expire after 7 days.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <WorkspaceInviteForm workspaceId={workspaceId} projects={projects} tasks={tasks} />
      </div>

      <p className="text-xs text-gray-500">
        Set <code className="rounded bg-gray-100 px-1">NEXT_PUBLIC_APP_URL</code> and SMTP
        variables in production so links and emails work correctly.
      </p>
    </div>
  )
}
