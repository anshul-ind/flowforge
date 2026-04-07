import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth/require-user'
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant'
import { ProjectService } from '@/modules/project/service'
import { PageContainer, PageHeader } from '@/components/layout/page-components'

interface ActivityPageProps {
  params: Promise<{ workspaceId: string; projectId: string }>
}

export async function generateMetadata({ params }: ActivityPageProps) {
  const { workspaceId, projectId } = await params
  const user = await requireUser()
  const tenant = await resolveTenantContext(workspaceId, user.id)
  if (!tenant) return { title: 'Activity' }
  const project = await new ProjectService(tenant).getProject(projectId)
  return { title: project ? `${project.title} · Activity` : 'Activity' }
}

export default async function ActivityPage({ params }: ActivityPageProps) {
  const { workspaceId, projectId } = await params
  const user = await requireUser()
  const tenant = await resolveTenantContext(workspaceId, user.id)
  if (!tenant) notFound()

  const project = await new ProjectService(tenant).getProject(projectId)
  if (!project) notFound()

  return (
    <PageContainer>
      <PageHeader
        title="Activity"
        description="Recent updates across tasks and collaborators in this project."
        breadcrumbs={[
          { label: 'Workspace', href: `/workspace/${workspaceId}` },
          { label: 'Projects', href: `/workspace/${workspaceId}/projects` },
          { label: project.title, href: `/workspace/${workspaceId}/projects/${projectId}` },
        ]}
      />
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-600">
        A project-scoped activity feed will appear here. Workspace-wide audit is available to owners
        under Activity log in the sidebar when enabled.
      </div>
    </PageContainer>
  )
}
