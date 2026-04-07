import { requireUser } from '@/lib/auth/require-user'
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant'
import { ProjectService } from '@/modules/project/service'
import { TaskService } from '@/modules/task/service'
import { PageHeader, PageContainer, Card } from '@/components/layout/page-components'
import { ProjectTaskUrlFilters } from '@/components/projects/project-task-url-filters'
import { getActiveWorkspaceMembersForFilters } from '@/lib/queries/workspace-members'
import { parseProjectTaskUrlSearchParams } from '@/lib/validation/project-task-url'
import Link from 'next/link'

interface TasksPageProps {
  params: Promise<{ workspaceId: string; projectId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: TasksPageProps) {
  const { workspaceId, projectId } = await params

  return {
    title: 'Tasks',
    description: 'Manage project tasks',
  }
}

export default async function TasksPage({ params, searchParams }: TasksPageProps) {
  const { workspaceId, projectId } = await params
  const sp = await searchParams
  const urlFilters = parseProjectTaskUrlSearchParams(sp)
  const user = await requireUser()
  const tenant = await resolveTenantContext(workspaceId, user.id)

  if (!tenant) {
    return <div>Access denied</div>
  }

  const projectService = new ProjectService(tenant)
  const taskService = new TaskService(tenant)

  const project = await projectService.getProject(projectId)
  const [tasks, memberRows] = await Promise.all([
    taskService.listProjectTasks(projectId, {
      status: urlFilters.status,
      assigneeId: urlFilters.assigneeId,
      q: urlFilters.q,
      due: urlFilters.due,
    }),
    getActiveWorkspaceMembersForFilters(workspaceId),
  ])

  if (!project) {
    return <div>Project not found</div>
  }

  const memberOptions = memberRows.map((m) => ({
    userId: m.userId,
    label: m.user.name || m.user.email || m.userId,
  }))

  const tasksByStatus = {
    BACKLOG: tasks.filter((t) => t.status === 'BACKLOG'),
    TODO: tasks.filter((t) => t.status === 'TODO'),
    IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS'),
    IN_REVIEW: tasks.filter((t) => t.status === 'IN_REVIEW'),
    DONE: tasks.filter((t) => t.status === 'DONE'),
    BLOCKED: tasks.filter((t) => t.status === 'BLOCKED'),
  }

  return (
    <PageContainer>
      <PageHeader
        title="Tasks"
        description={`Managing ${tasks.length} task${tasks.length !== 1 ? 's' : ''} in ${project.title}`}
        breadcrumbs={[
          { label: 'Workspace', href: `/workspace/${workspaceId}` },
          { label: 'Projects', href: `/workspace/${workspaceId}/projects` },
          { label: project.title, href: `/workspace/${workspaceId}/projects/${projectId}` },
          { label: 'Tasks' },
        ]}
        action={
          <Link
            href={`/workspace/${workspaceId}/projects/${projectId}/tasks/create`}
            className="px-4 py-2 rounded-lg bg-black text-white font-semibold hover:bg-gray-900 transition-colors"
          >
            New Task
          </Link>
        }
      />

      <ProjectTaskUrlFilters
        workspaceId={workspaceId}
        projectId={projectId}
        members={memberOptions}
        initial={urlFilters}
      />

      {/* Kanban View */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
          <Card key={status} className="flex flex-col">
            <div className="mb-4 pb-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 capitalize">
                {status.replace('-', ' ')}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {statusTasks.length} {statusTasks.length === 1 ? 'task' : 'tasks'}
              </p>
            </div>

            {statusTasks.length === 0 ? (
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-8 text-center">
                <p className="text-sm text-gray-500">No tasks</p>
              </div>
            ) : (
              <div className="space-y-3">
                {statusTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/workspace/${workspaceId}/projects/${projectId}/tasks/${task.id}`}
                    className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group"
                  >
                    <p className="font-medium text-gray-900 text-sm group-hover:text-black">
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <span
                        className="px-2 py-1 rounded text-xs font-semibold"
                        style={{
                          backgroundColor:
                            task.priority === 'HIGH'
                              ? '#fee2e2'
                              : task.priority === 'MEDIUM'
                                ? '#fef3c7'
                                : '#dbeafe',
                          color:
                            task.priority === 'HIGH'
                              ? '#991b1b'
                              : task.priority === 'MEDIUM'
                                ? '#92400e'
                                : '#1e40af',
                        }}
                      >
                        {task.priority}
                      </span>
                      {task.assigneeId && (
                        <span className="text-xs text-gray-500">
                          Assigned
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </PageContainer>
  )
}
