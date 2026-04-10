import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth/require-user'
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant'
import { isScopedInviteMember } from '@/lib/tenant/invite-restriction'
import { ForbiddenError } from '@/lib/errors'
import { canViewAuditLog } from '@/lib/permissions'
import { getWorkspaceAuditLogs } from '@/lib/audit'

export default async function WorkspaceAuditPage({
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

  if (!canViewAuditLog(tenant.role)) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Activity log</h1>
        <p className="text-gray-600">You do not have permission to view workspace activity.</p>
        <Link href={`/workspace/${workspaceId}`} className="text-sm font-medium text-blue-600">
          ← Workspace
        </Link>
      </div>
    )
  }

  const logs = await getWorkspaceAuditLogs(workspaceId, { limit: 80 })

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link
          href={`/workspace/${workspaceId}`}
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← Workspace
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Activity log</h1>
        <p className="mt-1 text-gray-600">Recent audited actions in this workspace (newest first).</p>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600">
          No audit entries yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                    {log.createdAt.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{log.action}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {log.entityType} · <span className="font-mono text-xs">{log.entityId}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {log.user.name ?? log.user.email ?? log.userId}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-gray-500" title={log.details ?? ''}>
                    {log.details ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
