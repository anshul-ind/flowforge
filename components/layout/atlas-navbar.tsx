'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronDown, Search, HelpCircle, Layout as LayoutIcon, Settings, LogOut } from 'lucide-react'
import { NotificationPopover } from '@/components/notification/notification-popover'

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
  const pathname = usePathname()
  const router = useRouter()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-between px-6 gap-4">
        {/* Left Section: Logo + Org Selector */}
        <div className="flex items-center gap-3 min-w-0">
          {workspaceId && (
            <>
              <div className="border-r border-gray-200 h-6" />
              <div className="relative">
                <button
                  onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
                >
                  <span className="max-w-[150px] truncate">{workspaceName}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {isOrgDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Workspaces</p>
                    </div>
                    <Link
                      href={`/workspace/${workspaceId}`}
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {workspaceName}
                    </Link>
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <Link
                        href="/workspace/new"
                        className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium"
                      >
                        + Create Workspace
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Center Section: Search */}
        <div className="flex-1 max-w-md hidden md:block">
          {workspaceId ? (
            <form
              className="relative"
              onSubmit={(e) => {
                e.preventDefault()
                if (!query.trim()) return
                router.push(
                  `/workspace/${workspaceId}/search?q=${encodeURIComponent(
                    query.trim()
                  )}`
                )
                setQuery('')
              }}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects, tasks..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:bg-white focus:border-gray-300 focus:outline-none transition-colors"
              />
            </form>
          ) : null}
        </div>

        {/* Right Section: Icons + User */}
        <div className="flex items-center gap-1">
          {/* Help */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            title="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* Layout */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors hidden sm:flex"
            title="Layout"
          >
            <LayoutIcon className="w-5 h-5" />
          </button>

          {/* Notifications */}
          {workspaceId ? (
            <div className="hidden sm:flex">
              <NotificationPopover workspaceId={workspaceId} />
            </div>
          ) : null}

          {/* Settings */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors hidden sm:flex"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* User Dropdown */}
          <div className="relative ml-2 border-l border-gray-200 pl-2">
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-7 h-7 rounded-full bg-gray-200"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700">
                  {getInitials(userName)}
                </div>
              )}
              <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
            </button>

            {isUserDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-500">{userEmail}</p>
                </div>
                <Link
                  href={`/workspace/${workspaceId}/settings`}
                  className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Settings
                </Link>
                <Link href="/sign-out" className="block px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
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
