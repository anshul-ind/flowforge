import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth/require-user'
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant'
import { isScopedInviteMember } from '@/lib/tenant/invite-restriction'
import { WorkspaceService } from '@/modules/workspace/service'
import { WorkspacePolicy } from '@/modules/workspace/policies'
import { ForbiddenError } from '@/lib/errors'
import { EmptyState } from '@/components/ui/empty-state'
import { WorkspaceSettingsForm } from '@/components/workspace/workspace-settings-form'

/**
 * Workspace Settings Page
 * 
 * Workspace configuration and management
 * Workspace details are editable for roles that can update the workspace.
 */
export default async function SettingsPage({
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

  const service = new WorkspaceService(tenant)
  const workspace = await service.getWorkspace()
  const canEdit = WorkspacePolicy.canUpdate(tenant)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your workspace</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Workspace</h2>
          {canEdit ? (
            <WorkspaceSettingsForm
              workspaceId={workspaceId}
              initialName={workspace.name}
              initialSlug={workspace.slug}
            />
          ) : (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Name</p>
                <p className="font-medium text-gray-900">{workspace.name}</p>
              </div>
              <div>
                <p className="text-gray-600">URL slug</p>
                <p className="font-medium font-mono text-gray-700">{workspace.slug}</p>
              </div>
              <p className="text-gray-500">Only owners and managers can change workspace details.</p>
            </div>
          )}
        </div>

        <div className="bg-red-50 rounded-lg border border-red-200 p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Danger zone</h2>
          <p className="text-sm text-red-700 mb-4">
            Deleting a workspace permanently removes its data. This action is not available yet.
          </p>
          <EmptyState
            title="Delete workspace"
            description="Workspace deletion will be added in a future release."
          />
        </div>
      </div>
    </div>
  )
}
