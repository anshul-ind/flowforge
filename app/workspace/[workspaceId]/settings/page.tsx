import { requireUser } from '@/lib/auth/require-user';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { WorkspaceService } from '@/modules/workspace/service';
import { ForbiddenError } from '@/lib/errors';
import { EmptyState } from '@/components/ui/empty-state';

/**
 * Workspace Settings Page
 * 
 * Workspace configuration and management
 * Includes edit and delete options for OWNER role
 */
export default async function SettingsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const user = await requireUser();
  
  // Resolve tenant context
  const tenant = await resolveTenantContext(workspaceId, user.id);

  if (!tenant) {
    throw new ForbiddenError('Workspace access denied');
  }

  // Fetch workspace
  const service = new WorkspaceService(tenant);
  const workspace = await service.getWorkspace();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your workspace</p>
      </div>

      {/* Settings sections */}
      <div className="grid grid-cols-1 gap-6">
        {/* Workspace info (read-only in Phase-6) */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Workspace Info</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Name</label>
              <p className="font-medium">{workspace.name}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Slug</label>
              <p className="font-medium text-gray-400">workspace.{workspace.slug}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Edit settings coming in Phase-7
          </p>
        </div>

        {/* Danger zone placeholder */}
        <div className="bg-red-50 rounded-lg border border-red-200 p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Danger Zone</h2>
          <p className="text-sm text-red-700 mb-4">
            Destructive actions are disabled in Phase-6
          </p>
          <EmptyState
            title="Delete workspace"
            description="Delete this workspace and all associated data (implement in Phase-7)"
          />
        </div>
      </div>
    </div>
  );
}
