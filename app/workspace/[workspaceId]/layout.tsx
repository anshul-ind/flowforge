import { requireUser } from '@/lib/auth/require-user';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { ForbiddenError } from '@/lib/errors';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { CommandPaletteProvider } from '@/components/search';
import { ReactNode } from 'react';

/**
 * Workspace Layout
 * 
 * This is the main layout for all workspace routes: /workspace/[workspaceId]/* 
 * 
 * Responsibilities:
 * 1. Authenticate user (requireUser redirects if needed)
 * 2. Resolve TenantContext (checks workspace membership)
 * 3. Fetch workspace details
 * 4. Render Sidebar + Topbar + {children}
 * 
 * Pattern:
 * - TenantContext resolved here means all child pages can assume tenant is valid
 * - ForbiddenError thrown here will be caught by error.tsx
 * - Uses EARLY RETURN on auth/tenant failures to prevent data fetching
 * 
 * Because this is a layout, Nextjs will NOT re-render it unless params change,
 * making it a perfect place for tenant resolution that all children need.
 */
export default async function WorkspaceLayout({
    
  params,
  children,
}: {
  params: Promise<unknown>;
  children: React.ReactNode;
}) {
  // Step 1: Ensure user is authenticated
  const resolvedParams = (await params) as { workspaceId: string };
  const { workspaceId } = resolvedParams;
  const user = await requireUser();

  // Step 2: Resolve tenant context (checks workspace membership)
  // If user is not a member, resolveTenantContext returns null
const tenant = await resolveTenantContext(workspaceId, user.id);

  if (!tenant) {
    // User is not a member of this workspace
    // error.tsx will catch this ForbiddenError
    throw new ForbiddenError('You do not have access to this workspace');
  }

  // At this point, we know:
  // - User is authenticated
  // - User is a member of this workspace
  // - TenantContext is valid
  // Safe to render workspace shell

  return (
    <>
      {/* Global command palette (Cmd+K) */}
      <CommandPaletteProvider workspaceId={workspaceId} />
      
      <div className="flex h-screen bg-white">
        {/* Sidebar: navigation, workspace switcher */}
        <Sidebar user={user} workspaceId={ workspaceId} />

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Topbar: user menu, notifications popover */}
          <Topbar user={user} workspaceId={workspaceId} />

          {/* Page content */}
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
