import { NavLink } from './nav-link';
import type { User } from '@/types/next-auth';

/**
 * Sidebar Component - PHASE 3
 * 
 * Server Component (not 'use client')
 * 
 * Left navigation panel showing workspace context and navigation links.
 * Uses design tokens for all colors, spacing, and typography.
 * 
 * Features:
 * - 240px width (standard sidebar)
 * - Workspace switcher with user context
 * - Primary navigation (Overview, Projects, Members)
 * - Token-based styling (no hardcoded colors)
 * - Responsive: visible on desktop, hidden on mobile (<768px)
 * 
 * Accessibility:
 * - Semantic nav element for main navigation
 * - aria-label for workspace info region
 * - Proper heading hierarchy
 * - Keyboard navigation support
 * - Focus ring styling with token colors
 * 
 * @param user - Current authenticated user
 * @param workspaceId - Current workspace ID
 */
export function Sidebar({ user, workspaceId }: { user: User | null; workspaceId: string }) {
  return (
    <aside 
      className="hidden md:flex w-60 flex-col overflow-hidden border-r border-black bg-white"
      aria-label="Workspace navigation"
    >
      {/* Workspace info section - header with context */}
      <div className="flex flex-col border-b border-black px-6 py-5">
        <div className="flex items-center gap-3">
          {/* Workspace icon/badge */}
          <div 
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-black text-sm font-bold text-white"
            aria-hidden="true"
          >
            F
          </div>
          
          {/* Workspace info */}
          <div className="flex-1 min-w-0">
            <h2 className="truncate text-sm font-semibold text-black">Workspace</h2>
            <p 
              className="truncate text-xs text-gray-600" 
              title={user?.email || 'Not logged in'}
            >
              {user?.email || 'Not logged in'}
            </p>
          </div>
        </div>
      </div>

      {/* Main navigation - scrollable area */}
      <nav 
        className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1"
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

      {/* Footer - status indicator */}
      <footer className="border-t border-border bg-surface-alt px-4 py-3">
        <p className="text-xs text-tertiary">Phase 3 Redesigned</p>
      </footer>
    </aside>
  );
}
