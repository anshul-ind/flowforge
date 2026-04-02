import { requireUser } from '@/lib/auth/require-user';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { ProjectService } from '@/modules/project/service';
import { ForbiddenError } from '@/lib/errors';
import { ProjectHeader } from '@/components/project/project-header';

/**
 * Project Detail Layout
 * 
 * Renders project header + tabs/nav for project detail views
 * All project routes will use this layout
 */
export default async function ProjectLayout({
  params,
  children,
}: {
  params: Promise<unknown>;
  children: React.ReactNode;
}) {
  // Resolve tenant context
  const resolvedParams = (await params) as { workspaceId: string; projectId: string };
  const { workspaceId, projectId } = resolvedParams;
  const user = await requireUser();
  
  const tenant = await resolveTenantContext(workspaceId, user.id);

  if (!tenant) {
    throw new ForbiddenError('Workspace access denied');
  }

  // Fetch project
  const service = new ProjectService(tenant);
  const project = await service.getProject(projectId);

  return (
    <div className="space-y-6">
      {/* Project header with name, status, description */}
      <ProjectHeader project={project} />

      {/* Project content (tasks, comments, etc.) */}
      {children}
    </div>
  );
}
