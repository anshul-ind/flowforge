import { notFound } from 'next/navigation'
import { PageHeader, PageContainer } from '@/components/layout/page-components'
import { CreateProjectForm } from '@/components/forms/create-project-form'
import { requireUser } from '@/lib/auth/require-user'
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant'
import { isScopedInviteMember } from '@/lib/tenant/invite-restriction'

export const metadata = {
  title: 'Create Project',
  description: 'Create a new project in your workspace',
}

interface CreateProjectPageProps {
  params: Promise<{ workspaceId: string }>
}

export default async function CreateProjectPage({
  params,
}: CreateProjectPageProps) {
  const { workspaceId } = await params
  const user = await requireUser()
  const tenant = await resolveTenantContext(workspaceId, user.id)
  if (!tenant || isScopedInviteMember(tenant)) {
    notFound()
  }

  return (
    <PageContainer>
      <PageHeader
        title="Create New Project"
        description="Start a new project within your workspace. You can manage tasks and team collaboration here."
        breadcrumbs={[
          { label: 'Workspace', href: `/workspace/${workspaceId}` },
          { label: 'Projects', href: `/workspace/${workspaceId}/projects` },
          { label: 'New Project' },
        ]}
      />

      <CreateProjectForm workspaceId={workspaceId} />
    </PageContainer>
  )
}
