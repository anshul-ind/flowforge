import { addDays, startOfDay } from 'date-fns'
import { prisma } from '@/lib/db'
import type { Prisma } from '@/lib/generated/prisma'
import { TaskStatus } from '@/lib/generated/prisma'
import { classifySearchStatus, type WorkspaceSearchQuery } from '@/lib/validation/search'

export type SearchResultItem = {
  kind: 'project' | 'task'
  id: string
  title: string
  subtitle: string | null
  href: string
  updatedAt: string
  meta: Record<string, unknown>
}

function taskDueClause(
  due: WorkspaceSearchQuery['due']
): Prisma.TaskWhereInput | undefined {
  if (due === 'all') return undefined
  const sod = startOfDay(new Date())
  if (due === 'overdue') {
    return {
      dueDate: { lt: sod },
      NOT: { status: TaskStatus.DONE },
    }
  }
  const end = addDays(sod, 14)
  return {
    dueDate: { gte: sod, lte: end },
  }
}

function textOrClause(q: string): Prisma.TaskWhereInput['OR'] | undefined {
  const t = q.trim()
  if (!t) return undefined
  return [
    { title: { contains: t, mode: 'insensitive' } },
    { description: { contains: t, mode: 'insensitive' } },
  ]
}

export type WorkspaceSearchNavScope = {
  restrictedProjectId?: string | null
  restrictedTaskId?: string | null
}

export async function runWorkspaceSearch(
  workspaceId: string,
  input: WorkspaceSearchQuery,
  navScope?: WorkspaceSearchNavScope | null
): Promise<{
  results: SearchResultItem[]
  page: number
  limit: number
  total: number
  hasMore: boolean
}> {
  const { q, type, projectId, status, assigneeId, due, page, limit } = input
  const skip = (page - 1) * limit
  const { taskStatus, projectStatus } = classifySearchStatus(status)
  const taskDue = taskDueClause(due)
  const qOr = textOrClause(q)

  const lockedProjectId =
    navScope?.restrictedProjectId != null && navScope.restrictedProjectId !== ''
      ? navScope.restrictedProjectId
      : null
  const effectiveProjectFilter = lockedProjectId ?? projectId ?? undefined

  const projectWhere: Prisma.ProjectWhereInput = {
    workspaceId,
    ...(effectiveProjectFilter ? { id: effectiveProjectFilter } : {}),
    ...(projectStatus ? { status: projectStatus } : {}),
    ...(qOr ? { OR: qOr as Prisma.ProjectWhereInput['OR'] } : {}),
  }

  if (
    lockedProjectId &&
    projectId &&
    projectId !== lockedProjectId
  ) {
    projectWhere.id = { in: [] }
  }

  const taskScopeClause: Prisma.TaskWhereInput = {}
  if (navScope?.restrictedTaskId) {
    taskScopeClause.id = navScope.restrictedTaskId
  } else if (lockedProjectId) {
    taskScopeClause.projectId = lockedProjectId
  }

  const taskWhereBase: Prisma.TaskWhereInput = {
    workspaceId,
    ...(projectId && !lockedProjectId ? { projectId } : {}),
    ...(taskStatus ? { status: taskStatus } : {}),
    ...(assigneeId ? { assigneeId } : {}),
    ...(taskDue ?? {}),
    ...(qOr ? { OR: qOr } : {}),
    ...taskScopeClause,
  }

  const orderProject: Prisma.ProjectOrderByWithRelationInput[] = [
    { updatedAt: 'desc' },
    { id: 'desc' },
  ]
  const orderTask: Prisma.TaskOrderByWithRelationInput[] = [
    { updatedAt: 'desc' },
    { id: 'desc' },
  ]

  if (type === 'projects') {
    const total = await prisma.project.count({ where: projectWhere })
    const rows = await prisma.project.findMany({
      where: projectWhere,
      orderBy: orderProject,
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        updatedAt: true,
      },
    })
    return {
      page,
      limit,
      total,
      hasMore: skip + rows.length < total,
      results: rows.map((p) => ({
        kind: 'project' as const,
        id: p.id,
        title: p.title,
        subtitle: p.description ?? null,
        href: `/workspace/${workspaceId}/projects/${p.id}`,
        updatedAt: p.updatedAt.toISOString(),
        meta: { status: p.status },
      })),
    }
  }

  if (type === 'tasks') {
    const total = await prisma.task.count({ where: taskWhereBase })
    const rows = await prisma.task.findMany({
      where: taskWhereBase,
      orderBy: orderTask,
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        projectId: true,
        updatedAt: true,
        project: { select: { title: true } },
      },
    })
    return {
      page,
      limit,
      total,
      hasMore: skip + rows.length < total,
      results: rows.map((t) => ({
        kind: 'task' as const,
        id: t.id,
        title: t.title,
        subtitle: t.project?.title ?? null,
        href: `/workspace/${workspaceId}/projects/${t.projectId}/tasks/${t.id}`,
        updatedAt: t.updatedAt.toISOString(),
        meta: {
          status: t.status,
          priority: t.priority,
          projectId: t.projectId,
        },
      })),
    }
  }

  // type === 'all' — merged ordering (updatedAt desc, id desc) with correct total count
  const [projectTotal, taskTotal] = await Promise.all([
    prisma.project.count({ where: projectWhere }),
    prisma.task.count({ where: taskWhereBase }),
  ])
  const total = projectTotal + taskTotal

  const fetchCap = Math.min(total, skip + limit + 200)
  const [projects, tasks] = await Promise.all([
    prisma.project.findMany({
      where: projectWhere,
      orderBy: orderProject,
      take: fetchCap,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        updatedAt: true,
      },
    }),
    prisma.task.findMany({
      where: taskWhereBase,
      orderBy: orderTask,
      take: fetchCap,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        projectId: true,
        updatedAt: true,
        project: { select: { title: true } },
      },
    }),
  ])

  type MergeRow =
    | {
        kind: 'project'
        id: string
        title: string
        description: string | null
        status: string
        updatedAt: Date
      }
    | {
        kind: 'task'
        id: string
        title: string
        description: string | null
        status: string
        priority: string
        projectId: string
        projectTitle: string | null
        updatedAt: Date
      }

  const merged: MergeRow[] = [
    ...projects.map((p) => ({
      kind: 'project' as const,
      id: p.id,
      title: p.title,
      description: p.description,
      status: p.status,
      updatedAt: p.updatedAt,
    })),
    ...tasks.map((t) => ({
      kind: 'task' as const,
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      projectId: t.projectId,
      projectTitle: t.project?.title ?? null,
      updatedAt: t.updatedAt,
    })),
  ]

  merged.sort((a, b) => {
    const dt = b.updatedAt.getTime() - a.updatedAt.getTime()
    if (dt !== 0) return dt
    return b.id.localeCompare(a.id)
  })

  const slice = merged.slice(skip, skip + limit)
  const results: SearchResultItem[] = slice.map((row) => {
    if (row.kind === 'project') {
      return {
        kind: 'project',
        id: row.id,
        title: row.title,
        subtitle: row.description,
        href: `/workspace/${workspaceId}/projects/${row.id}`,
        updatedAt: row.updatedAt.toISOString(),
        meta: { status: row.status },
      }
    }
    return {
      kind: 'task',
      id: row.id,
      title: row.title,
      subtitle: row.projectTitle,
      href: `/workspace/${workspaceId}/projects/${row.projectId}/tasks/${row.id}`,
      updatedAt: row.updatedAt.toISOString(),
      meta: {
        status: row.status,
        priority: row.priority,
        projectId: row.projectId,
      },
    }
  })

  return {
    page,
    limit,
    total,
    hasMore: skip + results.length < total,
    results,
  }
}
