import { requireUser } from '@/lib/auth/require-user'
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant'
import { ProjectService } from '@/modules/project/service'
import { TaskService } from '@/modules/task/service'
import { PageHeader, PageContainer, Card } from '@/components/layout/page-components'
import { ProjectTaskUrlFilters } from '@/components/projects/project-task-url-filters'
import { getActiveWorkspaceMembersForFilters } from '@/lib/queries/workspace-members'
import { parseProjectTaskUrlSearchParams } from '@/lib/validation/project-task-url'
import Link from 'next/link'

interface ProjectPageProps {
  params: Promise<{ workspaceId: string; projectId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { workspaceId, projectId } = await params
  const user = await requireUser()
  const tenant = await resolveTenantContext(workspaceId, user.id)

  if (!tenant) return { title: 'Project' }

  const service = new ProjectService(tenant)
  const project = await service.getProject(projectId)

  return {
    title: project?.title || 'Project',
    description: project?.description || '',
  }
}

export default async function ProjectPage({ params, searchParams }: ProjectPageProps) {
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

  const stats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter((t) => t.status === 'DONE').length,
    inProgressTasks: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    blockingTasks: tasks.filter((t) => t.priority === 'HIGH').length,
  }

  return (
    <PageContainer>
      <PageHeader
        title={project.title}
        description={project.description || undefined}
        breadcrumbs={[
          { label: 'Workspace', href: `/workspace/${workspaceId}` },
          { label: 'Projects', href: `/workspace/${workspaceId}/projects` },
          { label: project.title },
        ]}
        action={
          <a
            href={`/workspace/${workspaceId}/projects/${projectId}/tasks/new`}
            className="px-4 py-2 rounded-lg bg-black text-white font-semibold hover:bg-gray-900 transition-colors"
          >
            New Task
          </a>
        }
      />

      <ProjectTaskUrlFilters
        workspaceId={workspaceId}
        projectId={projectId}
        members={memberOptions}
        initial={urlFilters}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">
              Total Tasks
            </p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalTasks}</p>
          </div>
        </Card>
        <Card>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">
              Completed
            </p>
            <p className="text-3xl font-bold text-green-600">
              {stats.completedTasks}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">
              In Progress
            </p>
            <p className="text-3xl font-bold text-blue-600">
              {stats.inProgressTasks}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">
              High Priority
            </p>
            <p className="text-3xl font-bold text-red-600">
              {stats.blockingTasks}
            </p>
          </div>
        </Card>
      </div>

      {/* Recent Tasks */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Tasks</h3>
        {tasks.length === 0 ? (
          <p className="text-gray-500">No tasks yet. Create your first task to get started.</p>
        ) : (
          <div className="space-y-2">
            {tasks.slice(0, 5).map((task) => (
              <Link
                key={task.id}
                href={`/workspace/${workspaceId}/projects/${projectId}/tasks/${task.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-900">{task.title}</p>
                  <p className="text-sm text-gray-500">{task.description || 'No description'}</p>
                </div>
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
              </Link>
            ))}
          </div>
        )}
      </Card>
    </PageContainer>
  )
}
