import { ReactNode } from 'react'
import { requireUser } from '@/lib/auth/require-user'
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant'
import { ProjectService } from '@/modules/project/service'
import { NotFoundError } from '@/lib/errors'

/**
 * Project Layout
 * 
 * Renders within workspace layout
 * Provides project context to child pages
 */
export default async function ProjectLayout({
  params,
  children,
}: {
  params: Promise<{ workspaceId: string; projectId: string }>
  children: ReactNode
}) {
  const { workspaceId, projectId } = await params
  const user = await requireUser()
  const tenant = await resolveTenantContext(workspaceId, user.id)

  if (!tenant) {
    throw new NotFoundError('Workspace not found')
  }

  const service = new ProjectService(tenant)
  const project = await service.getProject(projectId)

  if (!project || project.workspaceId !== workspaceId) {
    throw new NotFoundError('Project not found')
  }

  return children
}
