import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth/require-user'
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant'
import { ProjectService } from '@/modules/project/service'
import { PageContainer, PageHeader } from '@/components/layout/page-components'
import Link from 'next/link'

interface BoardPageProps {
  params: Promise<{ workspaceId: string; projectId: string }>
}

export async function generateMetadata({ params }: BoardPageProps) {
  const { workspaceId, projectId } = await params
  const user = await requireUser()
  const tenant = await resolveTenantContext(workspaceId, user.id)
  if (!tenant) return { title: 'Board' }
  const project = await new ProjectService(tenant).getProject(projectId)
  return { title: project ? `${project.title} · Board` : 'Board' }
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { workspaceId, projectId } = await params
  const user = await requireUser()
  const tenant = await resolveTenantContext(workspaceId, user.id)
  if (!tenant) notFound()

  const project = await new ProjectService(tenant).getProject(projectId)
  if (!project) notFound()

  return (
    <PageContainer>
      <PageHeader
        title="Board"
        description="Kanban view for tasks in this project."
        breadcrumbs={[
          { label: 'Workspace', href: `/workspace/${workspaceId}` },
          { label: 'Projects', href: `/workspace/${workspaceId}/projects` },
          { label: project.title, href: `/workspace/${workspaceId}/projects/${projectId}` },
        ]}
      />
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-600">
        Board columns and drag-and-drop will appear here. Open{' '}
        <Link
          className="font-medium text-gray-900 underline"
          href={`/workspace/${workspaceId}/projects/${projectId}/tasks`}
        >
          Tasks
        </Link>{' '}
        to manage work today.
      </div>
    </PageContainer>
  )
}
