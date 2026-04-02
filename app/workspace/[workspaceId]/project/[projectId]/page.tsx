import { requireUser } from '@/lib/auth/require-user';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { ForbiddenError } from '@/lib/errors';
import { TaskService } from '@/modules/task/service';
import { TaskList } from '@/components/task/task-list';
import { TaskFilterWrapper } from '@/components/search';
import { ReactNode } from 'react';

/**
 * Project Detail Page
 * 
 * Displays project overview with tasks and comments
 * Phase-7: Task creation and listing
 * Phase-8: Comments with reactions and approvals
 */
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ workspaceId: string; projectId: string }>;
}) {
  const { workspaceId, projectId } = await params;
  const user = await requireUser();

  // Resolve tenant context
  const tenant = await resolveTenantContext(workspaceId, user.id);
  if (!tenant) {
    throw new ForbiddenError('Workspace access denied');
  }

  // Fetch tasks
  const taskService = new TaskService(tenant);
  const tasks = await taskService.listProjectTasks(projectId);

  return (
    <div className="space-y-6">
      {/* Tasks Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Tasks ({tasks.length})</h2>
        </div>
        
        {/* Advanced Filter Bar - Phase 10 */}
        <div className="mb-6 -mx-6 -my-6 px-6 py-6 border-b">
          <TaskFilterWrapper />
        </div>
        
        <TaskList tasks={tasks} workspaceId={workspaceId} projectId={projectId} />
      </div>

      {/* Comments Section - Phase 8 - Coming Soon */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Comments</h2>
          <span className="inline-block px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">Phase-8</span>
        </div>
        <div className="text-center py-8 text-gray-500">
          Comments and collaboration features coming in Phase-8
        </div>
      </div>
    </div>
  );
}
