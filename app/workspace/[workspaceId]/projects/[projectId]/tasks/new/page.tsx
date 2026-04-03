import { requireUser } from '@/lib/auth/require-user'
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant'
import { ProjectService } from '@/modules/project/service'
import { WorkspaceService } from '@/modules/workspace/service'
import { PageHeader, PageContainer } from '@/components/layout/page-components'
import { CreateTaskForm } from '@/components/forms/create-task-form'

interface NewTaskPageProps {
  params: Promise<{ workspaceId: string; projectId: string }>
}

export async function generateMetadata({ params }: NewTaskPageProps) {
  return {
    title: 'Create New Task',
    description: 'Create a new task in this project',
  }
}

export default async function NewTaskPage({ params }: NewTaskPageProps) {
  const { workspaceId, projectId } = await params
  const user = await requireUser()
  const tenant = await resolveTenantContext(workspaceId, user.id)

  if (!tenant) {
    return <div>Access denied</div>
  }

  const projectService = new ProjectService(tenant)
  const workspaceService = new WorkspaceService(tenant)

  const project = await projectService.getProject(projectId)
  const workspaceMembers = await workspaceService.getMembers()

  if (!project) {
    return <div>Project not found</div>
  }

  // Transform workspace members to the format expected by CreateTaskForm
  const formattedMembers = workspaceMembers
    .filter((m) => m.status === 'ACTIVE' || m.status === 'INVITED')
    .map((member) => ({
      id: member.userId,
      name: member.user.name || 'Unknown',
      email: member.user.email,
    }))

  return (
    <PageContainer>
      <PageHeader
        title="Create New Task"
        description={`Add a task to ${project.title}`}
        breadcrumbs={[
          { label: 'Workspace', href: `/workspace/${workspaceId}` },
          { label: 'Projects', href: `/workspace/${workspaceId}/projects` },
          { label: project.title, href: `/workspace/${workspaceId}/projects/${projectId}` },
          { label: 'Tasks', href: `/workspace/${workspaceId}/projects/${projectId}/tasks` },
          { label: 'New Task' },
        ]}
      />

      <CreateTaskForm
        workspaceId={workspaceId}
        projectId={projectId}
        members={formattedMembers}
      />
    </PageContainer>
  )
}
