import { requireUser } from '@/lib/auth/require-user'
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant'
import { ForbiddenError } from '@/lib/errors'
import { ProjectService } from '@/modules/project/service'
import { ProjectPolicy } from '@/modules/project/policies'
import { ProjectSettingsForm } from '@/components/projects/project-settings-form'
import { PageContainer, PageHeader, Card } from '@/components/layout/page-components'

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ workspaceId: string; projectId: string }>
}) {
  const { workspaceId, projectId } = await params
  const user = await requireUser()
  const tenant = await resolveTenantContext(workspaceId, user.id)

  if (!tenant) {
    throw new ForbiddenError('Workspace access denied')
  }

  const service = new ProjectService(tenant)
  const project = await service.getProject(projectId)
  if (!project) {
    return (
      <PageContainer>
        <p className="text-gray-600">Project not found.</p>
      </PageContainer>
    )
  }

  const canEdit = ProjectPolicy.canUpdate(tenant)

  return (
    <PageContainer>
      <PageHeader
        title="Project settings"
        description={"Update this project's details and status."}
        breadcrumbs={[
          { label: 'Workspace', href: `/workspace/${workspaceId}` },
          { label: 'Projects', href: `/workspace/${workspaceId}/projects` },
          { label: project.title, href: `/workspace/${workspaceId}/projects/${projectId}` },
          { label: 'Settings' },
        ]}
      />

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">General</h2>
        {canEdit ? (
          <ProjectSettingsForm
            workspaceId={workspaceId}
            projectId={projectId}
            initialTitle={project.title}
            initialDescription={project.description}
            initialStatus={project.status}
            initialDueDate={project.dueDate}
          />
        ) : (
          <div className="space-y-3 text-sm text-gray-600">
            <p>You do not have permission to edit this project.</p>
            <dl className="grid gap-2">
              <div>
                <dt className="text-gray-500">Title</dt>
                <dd className="font-medium text-gray-900">{project.title}</dd>
              </div>
              {project.description ? (
                <div>
                  <dt className="text-gray-500">Description</dt>
                  <dd className="text-gray-900">{project.description}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd className="font-medium text-gray-900">{project.status}</dd>
              </div>
            </dl>
          </div>
        )}
      </Card>
    </PageContainer>
  )
}
