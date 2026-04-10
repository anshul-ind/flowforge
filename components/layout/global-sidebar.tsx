'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, Menu, Settings, X, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  buildSidebarQuickLinks,
  buildSidebarSections,
  type SidebarNavItem,
  type SidebarNavScope,
  type SidebarNavSection,
} from '@/components/layout/sidebar-nav-build'

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

const RAIL_COLLAPSE_MS = 260
const RAIL_COLLAPSED_W = '4.25rem'
const RAIL_EXPANDED_W = '18rem'

export function GlobalSidebar({
  workspaceId,
  projectId,
  currentPath,
}: GlobalSidebarProps) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [hoverExpanded, setHoverExpanded] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(['quick', 'workspaces', 'projects', 'templates'])
  )
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [userWorkspaces, setUserWorkspaces] = useState<UserWorkspaceListItem[]>([])
  const [navScopeFetch, setNavScopeFetch] = useState<{
    workspaceId: string
    restrictedProjectId: string | null
    restrictedTaskId: string | null
  } | null>(null)

  const settingsHref = workspaceId ? `/workspace/${workspaceId}/settings` : '/workspace'

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

  useEffect(() => {
    if (!workspaceId) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/workspace/${workspaceId}/nav-scope`, {
          credentials: 'include',
        })
        if (!res.ok) return
        const data = (await res.json()) as {
          ok?: boolean
          restrictedProjectId?: string | null
          restrictedTaskId?: string | null
        }
        if (cancelled || !data?.ok) return
        setNavScopeFetch({
          workspaceId,
          restrictedProjectId: data.restrictedProjectId ?? null,
          restrictedTaskId: data.restrictedTaskId ?? null,
        })
      } catch {
        // non-fatal
      }
    })()
    return () => {
      cancelled = true
    }
  }, [workspaceId])

  const navScope: SidebarNavScope =
    workspaceId && navScopeFetch?.workspaceId === workspaceId
      ? {
          restrictedProjectId: navScopeFetch.restrictedProjectId,
          restrictedTaskId: navScopeFetch.restrictedTaskId,
        }
      : null

  const clearCollapseTimer = useCallback(() => {
    if (collapseTimer.current) {
      clearTimeout(collapseTimer.current)
      collapseTimer.current = null
    }
  }, [])

  const openRail = useCallback(() => {
    clearCollapseTimer()
    setHoverExpanded(true)
  }, [clearCollapseTimer])

  const scheduleCollapse = useCallback(() => {
    clearCollapseTimer()
    collapseTimer.current = setTimeout(() => {
      setHoverExpanded(false)
      collapseTimer.current = null
    }, RAIL_COLLAPSE_MS)
  }, [clearCollapseTimer])

  useEffect(() => () => clearCollapseTimer(), [clearCollapseTimer])

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(section)) next.delete(section)
      else next.add(section)
      return next
    })
  }, [])

  const isActive = (href: string) =>
    href !== '#' && (pathname === href || currentPath === href)

  const navSections = buildSidebarSections({
    workspaceId,
    projectId,
    userWorkspaces,
    navScope,
  })
  const quickLinks = buildSidebarQuickLinks(workspaceId, navScope)

  const quickSection: SidebarNavSection | null =
    quickLinks.length > 0
      ? { id: 'quick', title: 'Shortcuts', icon: Zap, items: quickLinks }
      : null

  const allSections = quickSection ? [quickSection, ...navSections] : navSections

  /** Desktop: show labels when hover-expanded; mobile drawer: when open */
  const labelsVisible = isMobileOpen || hoverExpanded

  const renderNavRows = (items: SidebarNavItem[], sectionId: string) =>
    items.map((item) => {
      const ItemIcon = item.icon
      return (
        <div key={`${sectionId}-${item.href}-${item.label}`}>
          <Link
            href={item.href}
            title={!labelsVisible ? item.label : undefined}
            className={cn(
              'flex items-center gap-3 rounded-r-lg border-l-2 py-2 text-sm transition-colors',
              labelsVisible ? 'px-3 pl-5' : 'justify-center px-0 md:justify-center',
              isActive(item.href)
                ? 'border-l-white bg-white/10 font-semibold text-white'
                : 'border-l-transparent text-neutral-400 hover:bg-white/5 hover:text-neutral-100'
            )}
            onClick={() => setIsMobileOpen(false)}
          >
            <ItemIcon className="h-5 w-5 shrink-0" aria-hidden />
            <span
              className={cn(
                'min-w-0 truncate transition-all duration-200 ease-out',
                labelsVisible ? 'max-w-[12rem] opacity-100' : 'max-w-0 opacity-0 md:overflow-hidden'
              )}
            >
              {item.label}
            </span>
          </Link>
          {item.sub && labelsVisible && (
            <div className="mt-1 ml-2 space-y-1 border-l border-white/10 pl-3">
              {item.sub.map((subItem) => {
                const SubIcon = subItem.icon
                return (
                  <Link
                    key={`${subItem.href}-${subItem.label}`}
                    href={subItem.href}
                    title={subItem.label}
                    className={cn(
                      'flex items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors',
                      isActive(subItem.href)
                        ? 'bg-white/10 font-medium text-white'
                        : 'text-neutral-500 hover:bg-white/5 hover:text-neutral-200'
                    )}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <SubIcon className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                    <span className="truncate">{subItem.label}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )
    })

  const renderSections = () => (
    <nav className="space-y-1 px-2 py-3">
      {allSections.map((section) => {
        const SectionIcon = section.icon
        return (
          <div key={section.id}>
            <button
              type="button"
              onClick={() => {
                if (!labelsVisible) openRail()
                toggleSection(section.id)
              }}
              className={cn(
                'flex w-full items-center rounded-lg py-2.5 text-xs font-bold uppercase tracking-widest text-neutral-500 transition-colors hover:text-white',
                labelsVisible ? 'justify-between px-3' : 'justify-center px-0'
              )}
              aria-expanded={expandedSections.has(section.id)}
              aria-label={!labelsVisible ? `${section.title} menu` : undefined}
            >
              <span className="flex min-w-0 items-center gap-2">
                <SectionIcon className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
                <span
                  className={cn(
                    'truncate transition-all duration-200 ease-out',
                    labelsVisible ? 'max-w-[10rem] opacity-100' : 'max-w-0 opacity-0 md:overflow-hidden'
                  )}
                >
                  {section.title}
                </span>
              </span>
              {labelsVisible && (
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 transition-transform',
                    expandedSections.has(section.id) && 'rotate-180'
                  )}
                />
              )}
            </button>
            {expandedSections.has(section.id) && (
              <div
                className={cn(
                  'mt-1 space-y-0.5 border-l-2 border-white/10',
                  labelsVisible ? '' : 'border-l-0'
                )}
              >
                {renderNavRows(section.items, section.id)}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )

  const sidebarLogoHref = workspaceId ? `/workspace/${workspaceId}` : '/'

  const headerBlock = (
    <div className="shrink-0 border-b border-white/10 bg-[#171717] px-2 py-4">
      <Link
        href={sidebarLogoHref}
        className={cn(
          'group flex items-center gap-3 rounded-lg transition-colors hover:bg-white/5',
          labelsVisible ? 'px-2' : 'justify-center px-0'
        )}
        onClick={() => setIsMobileOpen(false)}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-bold text-[#171717] group-hover:bg-neutral-100">
          FF
        </div>
        <div
          className={cn(
            'min-w-0 flex-1 overflow-hidden transition-all duration-200 ease-out',
            labelsVisible
              ? 'max-w-[11rem] opacity-100'
              : 'max-w-0 opacity-0 md:pointer-events-none md:sr-only'
          )}
        >
          <span className="block truncate text-lg font-bold tracking-tight text-white">FlowForge</span>
          <span className="block truncate text-xs text-neutral-400">Project management</span>
        </div>
      </Link>
    </div>
  )

  const settingsBlock = (
    <div className="mt-auto shrink-0 border-t border-white/10 bg-[#171717] px-2 py-3">
      <Link
        href={settingsHref}
        title={!labelsVisible ? 'Settings' : undefined}
        className={cn(
          'flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-white/5 hover:text-white',
          labelsVisible ? 'px-3' : 'justify-center px-0'
        )}
        onClick={() => setIsMobileOpen(false)}
      >
        <Settings className="h-5 w-5 shrink-0" aria-hidden />
        <span
          className={cn(
            'min-w-0 truncate transition-all duration-200 ease-out',
            labelsVisible ? 'max-w-[12rem] opacity-100' : 'max-w-0 opacity-0 md:overflow-hidden'
          )}
        >
          Settings
        </span>
      </Link>
    </div>
  )

  const hideWorkspaceSettings =
    navScope != null &&
    (navScope.restrictedProjectId != null || navScope.restrictedTaskId != null)

  const asideInner = (
    <div className="flex h-full min-h-0 flex-col bg-[#171717]">
      {headerBlock}
      <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">{renderSections()}</div>
      {hideWorkspaceSettings ? null : settingsBlock}
    </div>
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#171717] text-white shadow-lg hover:bg-neutral-800/90 md:hidden"
        aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Desktop: hover rail */}
      <div
        className="relative hidden h-full min-h-0 shrink-0 self-stretch md:flex md:max-h-full"
        onMouseEnter={openRail}
        onMouseLeave={scheduleCollapse}
      >
        <div className="flex h-full min-h-0 max-h-full flex-1 flex-row">
          <div className="w-2 shrink-0 bg-transparent" aria-hidden />
          <aside
            className="relative z-30 h-full max-h-full min-h-0 shrink-0 overflow-hidden border-r border-white/10 bg-app-shell transition-[width] duration-300 ease-out"
            style={{ width: hoverExpanded ? RAIL_EXPANDED_W : RAIL_COLLAPSED_W }}
          >
            {asideInner}
          </aside>
        </div>
      </div>

      {/* Mobile drawer — full viewport height */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-30 flex h-dvh max-h-dvh min-h-0 w-72 flex-col overflow-hidden border-r border-white/10 bg-[#171717] transition-transform duration-300 ease-out md:hidden',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-hidden={!isMobileOpen}
      >
        {asideInner}
      </aside>

      {isMobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          aria-hidden
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  )
}
