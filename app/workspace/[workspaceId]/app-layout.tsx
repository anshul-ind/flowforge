import { ReactNode } from 'react'
import { requireUser } from '@/lib/auth/require-user'
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant'
import { ForbiddenError } from '@/lib/errors'
import { WorkspaceSidebar } from '@/components/layout/workspace-sidebar'
import { Topbar } from '@/components/layout/topbar'

/**
 * Workspace App Layout
 * 
 * This layout renders:
 * - MongoDB Atlas-inspired fixed left sidebar with collapsible sections
 * - Sticky topbar with workspace context
 * - Dynamic right content area
 * 
 * All workspace routes render within this layout.
 * Sidebar state is client-side (collapsible sections).
 * Navigation is route-aware and highlights active page.
 */
export default async function WorkspaceAppLayout({
  params,
  children,
}: {
  params: Promise<{ workspaceId: string }>
  children: ReactNode
}) {
  const resolvedParams = await params
  const { workspaceId } = resolvedParams
  
  const user = await requireUser()
  const tenant = await resolveTenantContext(workspaceId, user.id)

  if (!tenant) {
    throw new ForbiddenError('You do not have access to this workspace')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Fixed Left Sidebar - MongoDB Atlas Style */}
      <WorkspaceSidebar
        user={user}
        workspaceId={workspaceId}
        workspaceRole={tenant.role}
      />

      {/* Right Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Sticky Topbar */}
        <Topbar user={user} workspaceId={workspaceId} />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="mx-auto max-w-7xl px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
