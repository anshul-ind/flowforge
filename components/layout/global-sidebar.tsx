'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WorkspaceRole } from '@/lib/generated/prisma'
import { canViewAuditLog } from '@/lib/permissions'

interface NavItem {
  label: string
  href: string
  sub?: NavItem[]
}

interface GlobalSidebarProps {
  workspaceId?: string
  projectId?: string
  currentPath?: string
}

interface UserWorkspaceListItem {
  id: string
  name: string
  slug: string
  role: string
}

export function GlobalSidebar({
  workspaceId,
  projectId,
  currentPath,
}: GlobalSidebarProps) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['workspaces', 'projects', 'templates'])
  )

  const [userWorkspaces, setUserWorkspaces] = useState<UserWorkspaceListItem[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/workspaces/list', { credentials: 'include' })
        if (!res.ok) return
        const data = (await res.json()) as { ok?: boolean; workspaces?: UserWorkspaceListItem[] }
        if (!cancelled && data?.ok && Array.isArray(data.workspaces)) {
          setUserWorkspaces(data.workspaces)
        }
      } catch {
        // Ignore (sidebar should not break page)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }, [])

  const isActive = (href: string) => pathname === href || currentPath === href

  // Build workspace items
  const workspaceItems: NavItem[] = [
    { label: 'All Workspaces', href: '/workspace' },
    { label: 'Create Workspace', href: '/workspace/new' },
    ...userWorkspaces.map((w) => ({
      label: w.name,
      href: `/workspace/${w.id}`,
      ...(workspaceId === w.id
        ? {
            sub: [
              { label: 'Overview', href: `/workspace/${w.id}` },
              { label: 'Members', href: `/workspace/${w.id}/members` },
              { label: 'Invitations', href: `/workspace/${w.id}/invitations` },
              ...(canViewAuditLog(w.role as WorkspaceRole)
                ? [{ label: 'Activity log', href: `/workspace/${w.id}/audit` }]
                : []),
              { label: 'Settings', href: `/workspace/${w.id}/settings` },
            ],
          }
        : {}),
    })),
  ]

  // Build project items
  const projectItems: NavItem[] = [
    {
      label: 'All Projects',
      href: workspaceId ? `/workspace/${workspaceId}/projects` : '#',
    },
    {
      label: 'Create Project',
      href: workspaceId ? `/workspace/${workspaceId}/projects/new` : '#',
    },
  ]

  if (projectId && workspaceId) {
    projectItems.push({
      label: 'Current Project',
      href: `/workspace/${workspaceId}/projects/${projectId}`,
      sub: [
        {
          label: 'Overview',
          href: `/workspace/${workspaceId}/projects/${projectId}`,
        },
        {
          label: 'Tasks',
          href: `/workspace/${workspaceId}/projects/${projectId}/tasks`,
        },
        {
          label: 'Board',
          href: `/workspace/${workspaceId}/projects/${projectId}/board`,
        },
        {
          label: 'Approvals',
          href: `/workspace/${workspaceId}/projects/${projectId}/approvals`,
        },
        {
          label: 'Activity',
          href: `/workspace/${workspaceId}/projects/${projectId}/activity`,
        },
      ],
    })
  }

  // Main navigation sections
  const navSections = [
    {
      id: 'workspaces',
      title: 'Workspaces',
      icon: '📦',
      items: workspaceItems,
    },
    {
      id: 'projects',
      title: 'Projects',
      icon: '📊',
      items: projectItems,
    },
    {
      id: 'templates',
      title: 'Templates',
      icon: '📋',
      items: [
        { label: 'Kanban', href: '#' },
        { label: 'Agile', href: '#' },
        { label: 'Waterfall', href: '#' },
      ],
    },
  ]

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed bottom-6 right-6 z-40 flex md:hidden h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-lg hover:bg-gray-900"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar - Desktop and Mobile */}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-30 w-72 overflow-y-auto border-r border-gray-800 bg-gradient-to-b from-gray-950 via-gray-900 to-black transition-transform md:relative md:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-gray-800 bg-black/80 backdrop-blur px-6 py-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white text-sm font-bold text-black group-hover:bg-gray-100 transition-colors">
              F
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-bold text-white">FlowForge</h2>
              <p className="truncate text-xs text-gray-400">Project Management</p>
            </div>
          </Link>
        </div>

        {/* Navigation Sections */}
        <nav className="space-y-1 px-3 py-4">
          {navSections.map((section) => (
            <div key={section.id}>
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors group"
              >
                <span className="flex items-center gap-2">
                  <span>{section.icon}</span>
                  <span>{section.title}</span>
                </span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    expandedSections.has(section.id) && 'rotate-180'
                  )}
                />
              </button>

              {/* Section Items */}
              {expandedSections.has(section.id) && (
                <div className="mt-2 space-y-1 border-l-2 border-gray-800">
                  {section.items.map((item) => (
                    <div key={`${section.id}-${item.href}-${item.label}`}>
                      {/* Main Item */}
                      <Link
                        href={item.href}
                        className={cn(
                          'block px-4 py-2 ml-0 text-sm transition-all rounded-r-lg border-l-2 -ml-2 pl-6',
                          isActive(item.href)
                            ? 'border-l-white bg-gray-800 text-white font-semibold'
                            : 'border-l-transparent text-gray-400 hover:bg-gray-900 hover:text-gray-200'
                        )}
                        onClick={() => setIsMobileOpen(false)}
                      >
                        {item.label}
                      </Link>

                      {/* Sub-items (Mega Dropdown) */}
                      {item.sub && (
                        <div className="mt-1 ml-4 space-y-1 border-l border-gray-800 pl-3">
                          {item.sub.map((subItem) => (
                            <Link
                                  key={`${subItem.href}-${subItem.label}`}
                              href={subItem.href}
                              className={cn(
                                'block px-3 py-1.5 text-xs rounded transition-all',
                                isActive(subItem.href)
                                  ? 'bg-white/10 text-white font-medium'
                                  : 'text-gray-500 hover:bg-gray-800/50 hover:text-gray-300'
                              )}
                              onClick={() => setIsMobileOpen(false)}
                            >
                              {subItem.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-gray-800 bg-black/80 backdrop-blur px-4 py-3">
          <p className="text-xs text-gray-500">FlowForge v1.0.0</p>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  )
}
