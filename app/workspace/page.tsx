import { requireUser } from '@/lib/auth/require-user';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

/**
 * Workspace List Page
 * 
 * Shows all workspaces the user is a member of
 * Provides quick access and ability to create new workspace
 */
export default async function WorkspacesPage() {
  const user = await requireUser();

  // Get all workspaces where the user is a member
  const workspaces = await prisma.workspaceMember.findMany({
    where: {
      userId: user.id,
    },
    include: {
      workspace: {
        include: {
          _count: {
            select: { 
              members: true,
              projects: true 
            },
          },
        },
      },
    },
  });

  const workspaceData = workspaces.map((wm) => ({
    ...wm.workspace,
    role: wm.role,
    memberCount: wm.workspace._count.members,
    projectCount: wm.workspace._count.projects,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workspaces</h1>
          <p className="text-gray-500 mt-1">
            Manage and access your workspaces
          </p>
        </div>
        <Link href="/workspace/new">
          <Button>Create Workspace</Button>
        </Link>
      </div>

      {/* Workspaces Grid */}
      {workspaceData.length === 0 ? (
        <EmptyState 
          title="No workspaces yet"
          description="Create your first workspace to get started"
          action={{
            label: "Create Workspace",
            href: "/workspace/new"
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaceData.map((workspace) => (
            <Link
              key={workspace.id}
              href={`/workspace/${workspace.id}`}
              className="group"
            >
              <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">
                      {workspace.name}
                    </h3>
                    <p className="text-sm text-gray-500">{workspace.slug}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded capitalize">
                    {workspace.role}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex gap-4 pt-4 border-t border-gray-100">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Members</p>
                    <p className="text-lg font-semibold">{workspace.memberCount}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Projects</p>
                    <p className="text-lg font-semibold">{workspace.projectCount}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
