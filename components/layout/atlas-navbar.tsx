'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronDown, Search, HelpCircle, Layout as LayoutIcon, Settings, LogOut } from 'lucide-react'
import { NotificationPopover } from '@/components/notification/notification-popover'
import { FlowForgeNavbarLogo } from '@/components/brand/flowforge-brand'
import { resolveAppShellLogoHref } from '@/lib/navigation/resolve-app-shell-logo-href'
import { cn } from '@/lib/utils'

const DROPDOWN_CLOSE_MS = 280

interface AtlasNavbarProps {
  workspaceName?: string
  workspaceId?: string
  userName?: string
  userEmail?: string
  userAvatar?: string
}

export function AtlasNavbar({
  workspaceName = 'Workspace',
  workspaceId = '',
  userName = 'User',
  userEmail = 'user@example.com',
  userAvatar = '',
}: AtlasNavbarProps) {
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [inviteScopeFetch, setInviteScopeFetch] = useState<{
    workspaceId: string
    scoped: boolean
  } | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const orgCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const userCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback((r: React.MutableRefObject<ReturnType<typeof setTimeout> | null>) => {
    if (r.current) {
      clearTimeout(r.current)
      r.current = null
    }
  }, [])

  const openOrg = useCallback(() => {
    clearTimer(orgCloseTimer)
    setIsOrgDropdownOpen(true)
  }, [clearTimer])

  const scheduleCloseOrg = useCallback(() => {
    clearTimer(orgCloseTimer)
    orgCloseTimer.current = setTimeout(() => {
      setIsOrgDropdownOpen(false)
      orgCloseTimer.current = null
    }, DROPDOWN_CLOSE_MS)
  }, [clearTimer])

  const openUser = useCallback(() => {
    clearTimer(userCloseTimer)
    setIsUserDropdownOpen(true)
  }, [clearTimer])

  const scheduleCloseUser = useCallback(() => {
    clearTimer(userCloseTimer)
    userCloseTimer.current = setTimeout(() => {
      setIsUserDropdownOpen(false)
      userCloseTimer.current = null
    }, DROPDOWN_CLOSE_MS)
  }, [clearTimer])

  useEffect(() => {
    return () => {
      clearTimer(orgCloseTimer)
      clearTimer(userCloseTimer)
    }
  }, [clearTimer])

  useEffect(() => {
    if (!workspaceId) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/workspace/${workspaceId}/nav-scope`, { credentials: 'include' })
        if (!res.ok) return
        const data = (await res.json()) as {
          ok?: boolean
          restrictedProjectId?: string | null
          restrictedTaskId?: string | null
        }
        if (cancelled || !data?.ok) return
        const scoped = Boolean(data.restrictedProjectId || data.restrictedTaskId)
        setInviteScopeFetch({ workspaceId, scoped })
      } catch {
        // ignore
      }
    })()
    return () => {
      cancelled = true
    }
  }, [workspaceId])

  const hideCreateWorkspace = Boolean(
    workspaceId &&
      inviteScopeFetch?.workspaceId === workspaceId &&
      inviteScopeFetch.scoped
  )

  const brandHref = resolveAppShellLogoHref(pathname)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <nav className="sticky top-0 z-40 shrink-0 border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 md:flex-none">
          <FlowForgeNavbarLogo href={brandHref} variant="onLight" />

          {workspaceId ? (
            <>
              <div className="hidden h-6 shrink-0 border-l border-gray-200 sm:block" />
              <div
                className="relative min-w-0"
                onMouseEnter={openOrg}
                onMouseLeave={scheduleCloseOrg}
              >
                <button
                  type="button"
                  className="flex max-w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100 sm:px-3"
                  aria-expanded={isOrgDropdownOpen}
                  aria-haspopup="true"
                  onFocus={openOrg}
                  onBlur={scheduleCloseOrg}
                >
                  <span className="max-w-[140px] truncate sm:max-w-[180px]">{workspaceName}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
                </button>

                <div
                  className={cn(
                    'absolute left-0 top-full z-50 mt-1 w-56 origin-top rounded-lg border border-gray-200 bg-white py-2 shadow-lg transition-all duration-200 ease-out',
                    isOrgDropdownOpen
                      ? 'pointer-events-auto translate-y-0 opacity-100'
                      : 'pointer-events-none -translate-y-1 opacity-0'
                  )}
                  onMouseEnter={openOrg}
                  onMouseLeave={scheduleCloseOrg}
                >
                  <div className="border-b border-gray-100 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Workspaces
                    </p>
                  </div>
                  <Link
                    href={`/workspace/${workspaceId}`}
                    className="block px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
                    onClick={() => setIsOrgDropdownOpen(false)}
                  >
                    {workspaceName}
                  </Link>
                  {!hideCreateWorkspace ? (
                    <div className="mt-2 border-t border-gray-100 pt-2">
                      <Link
                        href="/workspace/new"
                        className="block px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                        onClick={() => setIsOrgDropdownOpen(false)}
                      >
                        + Create Workspace
                      </Link>
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </div>

        <div className="hidden max-w-md flex-1 md:block">
          {workspaceId ? (
            <form
              className="relative"
              onSubmit={(e) => {
                e.preventDefault()
                if (!query.trim()) return
                router.push(`/workspace/${workspaceId}/search?q=${encodeURIComponent(query.trim())}`)
                setQuery('')
              }}
            >
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects, tasks..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 transition-colors focus:border-gray-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </form>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            title="Help"
          >
            <HelpCircle className="h-5 w-5" />
          </button>

          <button
            type="button"
            className="hidden rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 sm:flex"
            title="Layout"
          >
            <LayoutIcon className="h-5 w-5" />
          </button>

          {workspaceId ? (
            <div className="hidden sm:flex">
              <NotificationPopover workspaceId={workspaceId} />
            </div>
          ) : null}

          <button
            type="button"
            className="hidden rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 sm:flex"
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>

          <div
            className="relative ml-1 border-l border-gray-200 pl-2 sm:ml-2"
            onMouseEnter={openUser}
            onMouseLeave={scheduleCloseUser}
          >
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100"
              aria-expanded={isUserDropdownOpen}
              aria-haspopup="true"
              onFocus={openUser}
              onBlur={scheduleCloseUser}
            >
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="h-7 w-7 rounded-full bg-gray-200 object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700">
                  {getInitials(userName)}
                </div>
              )}
              <ChevronDown className="hidden h-4 w-4 text-gray-500 sm:block" />
            </button>

            <div
              className={cn(
                'absolute right-0 top-full z-50 mt-1 w-48 origin-top rounded-lg border border-gray-200 bg-white py-2 shadow-lg transition-all duration-200 ease-out',
                isUserDropdownOpen
                  ? 'pointer-events-auto translate-y-0 opacity-100'
                  : 'pointer-events-none -translate-y-1 opacity-0'
              )}
              onMouseEnter={openUser}
              onMouseLeave={scheduleCloseUser}
            >
              <div className="border-b border-gray-100 px-3 py-2">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">{userEmail}</p>
              </div>
              {workspaceId && !hideCreateWorkspace ? (
                <Link
                  href={`/workspace/${workspaceId}/settings`}
                  className="block px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
                  onClick={() => setIsUserDropdownOpen(false)}
                >
                  Settings
                </Link>
              ) : null}
              <Link
                href="/sign-out"
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={() => setIsUserDropdownOpen(false)}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
