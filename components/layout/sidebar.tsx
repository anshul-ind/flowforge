import { NavLink } from './nav-link';
import type { User } from '@/types/next-auth';

/**
 * Sidebar Component
 * 
 * Server Component (not 'use client')
 * 
 * Left navigation panel showing workspace context and navigation links
 * Displays workspace name and navigation to projects, members, settings
 * 
 * Accessibility:
 * - Semantic nav element for main navigation
 * - aria-label for workspace info region
 * - Proper heading hierarchy
 * - Keyboard navigation support
 * 
 * @param user - Current authenticated user
 * @param workspaceId - Current workspace ID
 */
export function Sidebar({ user, workspaceId }: { user: User | null; workspaceId: string }) {
  return (
    <aside 
      className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-hidden"
      aria-label="Workspace navigation"
    >
      {/* Workspace info section */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            aria-hidden="true"
          >
            F
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-gray-900 truncate">Workspace</h2>
            <p className="text-xs text-gray-500 truncate" title={user?.email || 'Unknown'}>
              {user?.email || 'Not logged in'}
            </p>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav 
        className="flex-1 p-4 space-y-1 overflow-y-auto"
        aria-label="Main workspace navigation"
      >
        <NavLink
          href={`/workspace/${workspaceId}`}
          label="Overview"
          icon="workspace"
        />
        <NavLink
          href={`/workspace/${workspaceId}/projects`}
          label="Projects"
          icon="projects"
        />
        <NavLink
          href={`/workspace/${workspaceId}/members`}
          label="Members"
          icon="members"
        />
      </nav>

      {/* Footer */}
      <footer className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500">Phase-6 Ready</p>
      </footer>
    </aside>
  );
}
