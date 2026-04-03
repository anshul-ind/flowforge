import { ReactNode } from 'react'
import { requireUser } from '@/lib/auth/require-user'
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant'
import { CommandPaletteProvider } from '@/components/search'
import { notFound } from 'next/navigation'

/**
 * Workspace Layout
 * 
 * This layout validates workspace access and provides context.
 * The actual layout (sidebar/navbar/footer) is handled by RootLayoutWrapper.
 * 
 * Responsibilities:
 * 1. Authenticate user
 * 2. Resolve tenant context (workspace membership)
 * 3. Ensure access to workspace
 * 4. Provide command palette for global search
 */
export default async function WorkspaceLayout({
  params,
  children,
}: {
  params: Promise<{ workspaceId: string }>
  children: ReactNode
}) {
  const resolvedParams = await params
  const { workspaceId } = resolvedParams
  const user = await requireUser()

  // Resolve tenant context (check workspace membership)
  const tenant = await resolveTenantContext(workspaceId, user.id)

  if (!tenant) {
    // Avoid throwing during render; return a clean 404 for unauthorized tenant access.
    // This keeps workspace tenant isolation intact without crashing the app.
    notFound()
  }

  return (
    <>
      <CommandPaletteProvider workspaceId={workspaceId} />
      {/* Content rendered by RootLayoutWrapper with sidebar/navbar/footer */}
      {children}
    </>
  )
}
