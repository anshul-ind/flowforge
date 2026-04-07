import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth/require-user'
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant'
import { ProjectService } from '@/modules/project/service'
import { PageContainer, PageHeader } from '@/components/layout/page-components'

interface ApprovalsPageProps {
  params: Promise<{ workspaceId: string; projectId: string }>
}

export async function generateMetadata({ params }: ApprovalsPageProps) {
  const { workspaceId, projectId } = await params
  const user = await requireUser()
  const tenant = await resolveTenantContext(workspaceId, user.id)
  if (!tenant) return { title: 'Approvals' }
  const project = await new ProjectService(tenant).getProject(projectId)
  return { title: project ? `${project.title} · Approvals` : 'Approvals' }
}

export default async function ApprovalsPage({ params }: ApprovalsPageProps) {
  const { workspaceId, projectId } = await params
  const user = await requireUser()
  const tenant = await resolveTenantContext(workspaceId, user.id)
  if (!tenant) notFound()

  const project = await new ProjectService(tenant).getProject(projectId)
  if (!project) notFound()

  return (
    <PageContainer>
      <PageHeader
        title="Approvals"
        description="Review and act on approval requests tied to this project."
        breadcrumbs={[
          { label: 'Workspace', href: `/workspace/${workspaceId}` },
          { label: 'Projects', href: `/workspace/${workspaceId}/projects` },
          { label: project.title, href: `/workspace/${workspaceId}/projects/${projectId}` },
        ]}
      />
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-600">
        Approval queue and history for this project will appear here.
      </div>
    </PageContainer>
  )
}
