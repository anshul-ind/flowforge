'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, Search, HelpCircle, Layout as LayoutIcon, Settings, LogOut } from 'lucide-react'
import { NotificationPopover } from '@/components/notification/notification-popover'
import { FlowForgeNavbarLogo } from '@/components/brand/flowforge-brand'

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
  const router = useRouter()

  const brandHref = workspaceId ? `/workspace/${workspaceId}` : '/'

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
              <div className="relative min-w-0">
                <button
                  type="button"
                  onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                  className="flex max-w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100 sm:px-3"
                >
                  <span className="max-w-[140px] truncate sm:max-w-[180px]">{workspaceName}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
                </button>

                {isOrgDropdownOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
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
                    <div className="mt-2 border-t border-gray-100 pt-2">
                      <Link
                        href="/workspace/new"
                        className="block px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                        onClick={() => setIsOrgDropdownOpen(false)}
                      >
                        + Create Workspace
                      </Link>
                    </div>
                  </div>
                )}
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

          <div className="relative ml-1 border-l border-gray-200 pl-2 sm:ml-2">
            <button
              type="button"
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100"
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

            {isUserDropdownOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                <div className="border-b border-gray-100 px-3 py-2">
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-500">{userEmail}</p>
                </div>
                <Link
                  href={`/workspace/${workspaceId}/settings`}
                  className="block px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
                  onClick={() => setIsUserDropdownOpen(false)}
                >
                  Settings
                </Link>
                <Link
                  href="/sign-out"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  onClick={() => setIsUserDropdownOpen(false)}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
