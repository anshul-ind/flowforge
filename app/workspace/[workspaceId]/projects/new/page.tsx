import { PageHeader, PageContainer } from '@/components/layout/page-components'
import { CreateProjectForm } from '@/components/forms/create-project-form'

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
