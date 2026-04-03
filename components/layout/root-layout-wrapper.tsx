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
 * Root Layout Wrapper
 * 
 * Conditionally renders sidebar and footer based on current route.
 * 
 * Routes WITHOUT sidebar/footer:
 * - /
 * - /sign-in
 * - /sign-up
 * 
 * Routes WITH sidebar/footer:
 * - /workspace/*
 * - /dashboard/*
 * - All other authenticated routes
 */
export function RootLayoutWrapper({ children }: RootLayoutWrapperProps) {
  const pathname = usePathname()
  const sessionResult = useSession()
  const session = sessionResult?.data

  // Routes that should NOT have sidebar/footer
  const noLayoutRoutes = ['/', '/sign-in', '/sign-up']
  const shouldShowLayout = !noLayoutRoutes.includes(pathname)

  // Extract workspace and project IDs from pathname if present
  const workspaceMatch = pathname.match(/\/workspace\/([^/]+)/)
  const projectMatch = pathname.match(/\/workspace\/[^/]+\/projects\/([^/]+)/)

  const workspaceId = workspaceMatch?.[1]
  const projectId = projectMatch?.[1]

  if (!shouldShowLayout) {
    // Landing page and auth pages - no sidebar, but show landing footer
    return (
      <>
        {children}
        <Footer />
      </>
    )
  }

  // Authenticated pages - with sidebar and Atlas navbar/footer
  return (
    <div className="flex min-h-screen bg-white flex-col">
      {/* Atlas Navbar */}
      <AtlasNavbar
        workspaceName={workspaceId ? `Workspace ${workspaceId}` : 'FlowForge'}
        workspaceId={workspaceId}
        userName={session?.user?.name || 'User'}
        userEmail={session?.user?.email || ''}
      />

      {/* Main Content with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Global Sidebar */}
        <GlobalSidebar workspaceId={workspaceId} projectId={projectId} currentPath={pathname} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Atlas Footer */}
      <AtlasFooter />
    </div>
  )
}
