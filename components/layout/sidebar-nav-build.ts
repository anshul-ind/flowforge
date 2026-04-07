import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  BarChart3,
  Bell,
  CheckCircle,
  Columns,
  FolderKanban,
  FolderPlus,
  Home,
  LayoutDashboard,
  LayoutGrid,
  Layers,
  ListTodo,
  Mail,
  PlusCircle,
  ScrollText,
  Search,
  Settings,
  Users,
} from 'lucide-react'
import type { WorkspaceRole } from '@/lib/generated/prisma'
import { canViewAuditLog } from '@/lib/permissions'

export type SidebarNavItem = {
  label: string
  href: string
  icon: LucideIcon
  sub?: SidebarNavItem[]
}

export type SidebarNavSection = {
  id: string
  title: string
  icon: LucideIcon
  items: SidebarNavItem[]
}

type WorkspaceRow = { id: string; name: string; slug: string; role: string }

export function buildSidebarQuickLinks(
  workspaceId: string | undefined
): SidebarNavItem[] {
  if (!workspaceId) return []
  const base = `/workspace/${workspaceId}`
  return [
    { label: 'Search', href: `${base}/search`, icon: Search },
    { label: 'Notifications', href: `${base}/notifications`, icon: Bell },
    { label: 'Analytics', href: `${base}/analytics`, icon: BarChart3 },
  ]
}

export function buildSidebarSections(options: {
  workspaceId?: string
  projectId?: string
  userWorkspaces: WorkspaceRow[]
}): SidebarNavSection[] {
  const { workspaceId, projectId, userWorkspaces } = options

  const workspaceItems: SidebarNavItem[] = [
    { label: 'All Workspaces', href: '/workspace', icon: LayoutGrid },
    { label: 'Create Workspace', href: '/workspace/new', icon: PlusCircle },
    ...userWorkspaces.map((w) => ({
      label: w.name,
      href: `/workspace/${w.id}`,
      icon: Home,
      ...(workspaceId === w.id
        ? {
            sub: [
              { label: 'Overview', href: `/workspace/${w.id}`, icon: Home },
              { label: 'Members', href: `/workspace/${w.id}/members`, icon: Users },
              { label: 'Invitations', href: `/workspace/${w.id}/invitations`, icon: Mail },
              ...(canViewAuditLog(w.role as WorkspaceRole)
                ? [
                    {
                      label: 'Activity log',
                      href: `/workspace/${w.id}/audit`,
                      icon: ScrollText,
                    },
                  ]
                : []),
              {
                label: 'Settings',
                href: `/workspace/${w.id}/settings`,
                icon: Settings,
              },
            ] satisfies SidebarNavItem[],
          }
        : {}),
    })),
  ]

  const projectItems: SidebarNavItem[] = [
    {
      label: 'All Projects',
      href: workspaceId ? `/workspace/${workspaceId}/projects` : '#',
      icon: FolderKanban,
    },
    {
      label: 'Create Project',
      href: workspaceId ? `/workspace/${workspaceId}/projects/new` : '#',
      icon: FolderPlus,
    },
  ]

  if (projectId && workspaceId) {
    const pbase = `/workspace/${workspaceId}/projects/${projectId}`
    projectItems.push({
      label: 'Current Project',
      href: pbase,
      icon: LayoutDashboard,
      sub: [
        { label: 'Overview', href: pbase, icon: LayoutDashboard },
        { label: 'Settings', href: `${pbase}/settings`, icon: Settings },
        { label: 'Tasks', href: `${pbase}/tasks`, icon: ListTodo },
        { label: 'Board', href: `${pbase}/board`, icon: Columns },
        { label: 'Approvals', href: `${pbase}/approvals`, icon: CheckCircle },
        { label: 'Activity', href: `${pbase}/activity`, icon: Activity },
      ],
    })
  }

  return [
    {
      id: 'workspaces',
      title: 'Workspaces',
      icon: LayoutGrid,
      items: workspaceItems,
    },
    {
      id: 'projects',
      title: 'Projects',
      icon: FolderKanban,
      items: projectItems,
    },
    {
      id: 'templates',
      title: 'Templates',
      icon: Layers,
      items: [
        { label: 'Kanban', href: '#', icon: Columns },
        { label: 'Agile', href: '#', icon: ListTodo },
        { label: 'Waterfall', href: '#', icon: LayoutGrid },
      ],
    },
  ]
}
