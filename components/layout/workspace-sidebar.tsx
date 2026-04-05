'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { User } from '@/types/next-auth'
import type { WorkspaceRole } from '@/lib/generated/prisma'
import { canViewAuditLog } from '@/lib/permissions'

interface WorkspaceSidebarProps {
  user: User | null
  workspaceId: string
  currentProjectId?: string
  workspaceRole?: WorkspaceRole
}

interface NavSection {
  id: string
  title: string
  icon: string
  items: NavItem[]
}

interface NavItem {
  label: string
  href: string
  icon?: string
}

export function WorkspaceSidebar({
  user,
  workspaceId,
  currentProjectId,
  workspaceRole,
}: WorkspaceSidebarProps) {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['workspace', 'projects'])
  )

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }, [])

  const isActive = (href: string) => pathname === href

  const auditHref = `/workspace/${workspaceId}/audit`

  const sections: NavSection[] = [
    {
      id: 'workspace',
      title: 'Workspace',
      icon: 'workspace',
      items: [
        { label: 'Overview', href: `/workspace/${workspaceId}` },
        { label: 'Members', href: `/workspace/${workspaceId}/members` },
        { label: 'Invitations', href: `/workspace/${workspaceId}/invitations` },
        ...(workspaceRole && canViewAuditLog(workspaceRole)
          ? [{ label: 'Activity log', href: auditHref }]
          : []),
        { label: 'Settings', href: `/workspace/${workspaceId}/settings` },
      ],
    },
    {
      id: 'projects',
      title: 'Projects',
      icon: 'projects',
      items: [
        { label: 'All Projects', href: `/workspace/${workspaceId}/projects` },
        { label: 'Create Project', href: `/workspace/${workspaceId}/projects/new` },
        ...(currentProjectId
          ? [
              {
                label: 'Project Overview',
                href: `/workspace/${workspaceId}/projects/${currentProjectId}`,
              },
              {
                label: 'Tasks',
                href: `/workspace/${workspaceId}/projects/${currentProjectId}/tasks`,
              },
              {
                label: 'Board',
                href: `/workspace/${workspaceId}/projects/${currentProjectId}/board`,
              },
              {
                label: 'Approvals',
                href: `/workspace/${workspaceId}/projects/${currentProjectId}/approvals`,
              },
              {
                label: 'Activity',
                href: `/workspace/${workspaceId}/projects/${currentProjectId}/activity`,
              },
            ]
          : []),
      ],
    },
    ...(workspaceRole === 'OWNER'
      ? [
          {
            id: 'analytics',
            title: 'Analytics',
            icon: 'analytics',
            items: [{ label: 'Dashboard', href: `/workspace/${workspaceId}/analytics` }],
          } satisfies NavSection,
        ]
      : []),
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'notifications',
      items: [
        { label: 'Notification Center', href: `/workspace/${workspaceId}/notifications` },
      ],
    },
  ]

  return (
    <aside className="hidden h-screen w-64 flex-col overflow-hidden border-r border-gray-200 bg-white md:flex">
      {/* Header - Workspace Info */}
      <div className="border-b border-gray-200 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-black text-sm font-bold text-white">
            F
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="truncate text-sm font-semibold text-gray-900">FlowForge</h2>
            <p className="truncate text-xs text-gray-500" title={user?.email || ''}>
              {user?.email || 'Workspace'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {sections.map((section) => (
            <div key={section.id}>
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide hover:text-gray-900 transition-colors"
              >
                <span>{section.title}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    expandedSections.has(section.id) && 'rotate-180'
                  )}
                />
              </button>

              {/* Section Items */}
              {expandedSections.has(section.id) && (
                <div className="mt-1 space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'block px-3 py-2 text-sm rounded transition-colors',
                        isActive(item.href)
                          ? 'bg-gray-100 text-gray-900 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
        <p className="text-xs text-gray-500">Workspace Admin</p>
      </div>
    </aside>
  )
}
