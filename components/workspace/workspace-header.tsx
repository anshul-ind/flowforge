import { Workspace } from '@/lib/generated/prisma';

/**
 * Workspace Header Component
 * 
 * Displays workspace name, slug, and member count
 */
export function WorkspaceHeader({
  workspace,
  memberCount,
}: {
  workspace: Workspace;
  memberCount: number;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{workspace.name}</h1>
          <p className="text-gray-500 mt-1">
            workspace.{workspace.slug}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Created {workspace.createdAt.toLocaleDateString()}
          </p>
        </div>

        {/* Member count badge */}
        <div className="bg-blue-50 rounded-lg px-4 py-3 text-center">
          <p className="text-2xl font-bold text-blue-900">{memberCount}</p>
          <p className="text-xs text-blue-700">Members</p>
        </div>
      </div>
    </div>
  );
}
