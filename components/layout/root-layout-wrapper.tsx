'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { GlobalSidebar } from './global-sidebar'
import { AtlasNavbar } from './atlas-navbar'
import { AtlasFooter } from './atlas-footer'
import { Footer } from './footer'

interface RootLayoutWrapperProps {
  children: ReactNode
}

/**
 * App shell (navbar + hover sidebar + atlas footer) only under `/workspace/*`.
 * Marketing landing uses its own layout/footer. Auth, invite, sign-out, and other
 * routes stay chrome-light without the dashboard shell.
 */
export function RootLayoutWrapper({ children }: RootLayoutWrapperProps) {
  const pathname = usePathname()
  const sessionResult = useSession()
  const session = sessionResult?.data

  const isMarketingHome = pathname === '/'
  const isAuthLike =
    pathname === '/sign-in' ||
    pathname === '/sign-up' ||
    pathname === '/sign-out' ||
    pathname?.startsWith('/invite') ||
    pathname?.startsWith('/auth/') ||
    pathname?.startsWith('/onboarding')
  const isWorkspaceApp = pathname?.startsWith('/workspace') ?? false

  const workspaceMatch = pathname?.match(/\/workspace\/([^/]+)/)
  const projectMatch = pathname?.match(/\/workspace\/[^/]+\/projects\/([^/]+)/)
  const workspaceId = workspaceMatch?.[1]
  const projectId = projectMatch?.[1]

  if (isWorkspaceApp) {
    return (
      <div className="flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden bg-white">
        <AtlasNavbar
          workspaceName={workspaceId ? `Workspace ${workspaceId}` : 'FlowForge'}
          workspaceId={workspaceId}
          userName={session?.user?.name || 'User'}
          userEmail={session?.user?.email || ''}
        />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <GlobalSidebar workspaceId={workspaceId} projectId={projectId} currentPath={pathname} />

          <main className="min-h-0 flex-1 overflow-auto">{children}</main>
        </div>

        <AtlasFooter />
      </div>
    )
  }

  // Landing: marketing layout already includes footer — avoid duplicate
  if (isMarketingHome) {
    return <>{children}</>
  }

  // Auth, invite, sign-out, onboarding, 404, etc.: page content only (no marketing Footer)
  if (isAuthLike || pathname == null) {
    return <>{children}</>
  }

  return (
    <>
      {children}
      <Footer />
    </>
  )
}
