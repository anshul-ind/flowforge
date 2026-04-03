import { requireUser } from '@/lib/auth/require-user'
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant'
import { ProjectService } from '@/modules/project/service'
import { ForbiddenError } from '@/lib/errors'
import { PageHeader, PageContainer, Card, EmptyState } from '@/components/layout/page-components'
import { ProjectStatus } from '@/lib/generated/prisma'
import Link from 'next/link'

/**
 * Projects List Page
 * 
 * Shows all projects in the workspace
 */
export default async function ProjectsPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>
  searchParams: Record<string, string | string[] | undefined>
}) {
  const { workspaceId } = await params
  const user = await requireUser()

  // Resolve tenant context
  const tenant = await resolveTenantContext(workspaceId, user.id)

  if (!tenant) {
    throw new ForbiddenError('Workspace access denied')
  }

  // Parse status filter from query params
  const statusFilter = searchParams.status as ProjectStatus | undefined

  // Fetch projects
  const service = new ProjectService(tenant)
  const projects = await service.listProjects(
    statusFilter ? { status: statusFilter } : undefined
  )

  return (
    <PageContainer>
      <PageHeader
        title="Projects"
        description={`You have ${projects.length} project${projects.length !== 1 ? 's' : ''}`}
        breadcrumbs={[
          { label: 'Workspace', href: `/workspace/${workspaceId}` },
          { label: 'Projects' },
        ]}
        action={
          <Link
            href={`/workspace/${workspaceId}/projects/new`}
            className="px-4 py-2 rounded-lg bg-black text-white font-semibold hover:bg-gray-900 transition-colors"
          >
            New Project
          </Link>
        }
      />

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to get started"
          action={
            <Link
              href={`/workspace/${workspaceId}/projects/new`}
              className="px-4 py-2 rounded-lg bg-black text-white font-semibold hover:bg-gray-900 transition-colors inline-block"
            >
              Create Project
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/workspace/${workspaceId}/projects/${project.id}`}
            >
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-black">
                    {project.title}
                  </h3>
                  {project.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor:
                          project.status === 'ACTIVE' ? '#dcfce7' : '#f3f4f6',
                        color:
                          project.status === 'ACTIVE' ? '#166534' : '#6b7280',
                      }}
                    >
                      {project.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
