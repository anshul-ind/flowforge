import { requireUser } from '@/lib/auth/require-user';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { ProjectService } from '@/modules/project/service';
import { ForbiddenError } from '@/lib/errors';
import { ProjectList } from '@/components/project/project-list';
import { CreateProjectForm } from '@/components/project/create-project-form';
import { ProjectFilterWrapper } from '@/components/search';
import { ProjectStatus } from '@/lib/generated/prisma';
import { ReactNode } from 'react';

/**
 * Projects List Page
 * 
 * Shows all projects in the workspace with ability to create new projects
 * Optional filtering by status via ?status=ACTIVE query param
 */
export default async function ProjectsPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { workspaceId } = await params;
  const user = await requireUser();
  
  // Resolve tenant context
  const tenant = await resolveTenantContext(workspaceId, user.id);

  if (!tenant) {
    throw new ForbiddenError('Workspace access denied');
  }

  // Parse status filter from query params
  const statusFilter = searchParams.status as ProjectStatus | undefined;

  // Fetch projects
  const service = new ProjectService(tenant);
  const projects = await service.listProjects(
    statusFilter ? { status: statusFilter } : undefined
  );

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-gray-500 mt-1">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
            {statusFilter && ` - Filtered by ${statusFilter}`}
          </p>
        </div>
        <CreateProjectForm workspaceId={workspaceId} />
      </div>

      {/* Advanced Filter Bar - Phase 10 */}
      <ProjectFilterWrapper />

      {/* Projects list/grid */}
      <ProjectList projects={projects} workspaceId={ workspaceId} />
    </div>
  );
}
