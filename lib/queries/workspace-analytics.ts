import { startOfDay } from 'date-fns'
import { prisma } from '@/lib/db'
import { ProjectStatus, TaskStatus, ApprovalStatus, MemberStatus } from '@/lib/generated/prisma'

export type WorkspaceAnalyticsSnapshot = {
  totals: {
    tasks: number
    tasksDone: number
    projectsActive: number
    projectsArchived: number
    overdueTasks: number
    pendingApprovals: number
    invitesOutstanding: number
    membersActive: number
  }
  tasksByStatus: { status: TaskStatus; count: number }[]
  workloadByAssignee: {
    userId: string
    name: string | null
    email: string | null
    openTasks: number
  }[]
  overdueSamples: {
    id: string
    title: string
    dueDate: Date | null
    assigneeName: string | null
    projectTitle: string
    projectId: string
  }[]
  approvals: {
    pending: number
    approved: number
    rejected: number
  }
  avgCycleTimeDaysDone: number | null
}

/**
 * Aggregates for workspace analytics. Caller MUST verify tenant access (e.g. OWNER-only route).
 * All queries are scoped by workspaceId.
 */
export async function getWorkspaceAnalyticsSnapshot(
  workspaceId: string
): Promise<WorkspaceAnalyticsSnapshot> {
  const sod = startOfDay(new Date())

  const [
    tasksByStatusRows,
    projectsActive,
    projectsArchived,
    overdueTasks,
    pendingApprovals,
    approvalCounts,
    invitesOutstanding,
    membersActive,
    workloadRows,
    overdueSamples,
    doneTasksForCycle,
  ] = await Promise.all([
    prisma.task.groupBy({
      by: ['status'],
      where: { workspaceId },
      _count: { _all: true },
    }),
    prisma.project.count({
      where: { workspaceId, status: { in: [ProjectStatus.ACTIVE, ProjectStatus.PLANNED, ProjectStatus.ON_HOLD] } },
    }),
    prisma.project.count({
      where: { workspaceId, status: ProjectStatus.ARCHIVED },
    }),
    prisma.task.count({
      where: {
        workspaceId,
        dueDate: { lt: sod },
        NOT: { status: TaskStatus.DONE },
      },
    }),
    prisma.approvalRequest.count({
      where: { workspaceId, status: ApprovalStatus.PENDING },
    }),
    prisma.approvalRequest.groupBy({
      by: ['status'],
      where: { workspaceId },
      _count: { _all: true },
    }),
    prisma.workspaceInvite.count({
      where: {
        workspaceId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
        revokedAt: null,
      },
    }),
    prisma.workspaceMember.count({
      where: { workspaceId, status: MemberStatus.ACTIVE },
    }),
    prisma.task.groupBy({
      by: ['assigneeId'],
      where: {
        workspaceId,
        assigneeId: { not: null },
        NOT: { status: TaskStatus.DONE },
      },
      _count: { _all: true },
    }),
    prisma.task.findMany({
      where: {
        workspaceId,
        dueDate: { lt: sod },
        NOT: { status: TaskStatus.DONE },
      },
      orderBy: [{ dueDate: 'asc' }],
      take: 15,
      select: {
        id: true,
        title: true,
        dueDate: true,
        projectId: true,
        assignee: { select: { name: true } },
        project: { select: { title: true } },
      },
    }),
    prisma.task.findMany({
      where: { workspaceId, status: TaskStatus.DONE },
      select: { createdAt: true, updatedAt: true },
      take: 500,
      orderBy: { updatedAt: 'desc' },
    }),
  ])

  const statusOrder = Object.values(TaskStatus)
  const tasksByStatus = statusOrder.map((status) => ({
    status,
    count: tasksByStatusRows.find((r) => r.status === status)?._count._all ?? 0,
  }))

  const totalTasks = tasksByStatus.reduce((a, b) => a + b.count, 0)
  const tasksDone = tasksByStatus.find((t) => t.status === TaskStatus.DONE)?.count ?? 0

  const assigneeIds = workloadRows
    .map((r) => r.assigneeId)
    .filter((id): id is string => id != null)

  const users = await prisma.user.findMany({
    where: { id: { in: assigneeIds } },
    select: { id: true, name: true, email: true },
  })
  const userMap = new Map(users.map((u) => [u.id, u]))

  const workloadByAssignee = workloadRows
    .filter((r) => r.assigneeId)
    .map((r) => {
      const u = userMap.get(r.assigneeId as string)
      return {
        userId: r.assigneeId as string,
        name: u?.name ?? null,
        email: u?.email ?? null,
        openTasks: r._count._all,
      }
    })
    .sort((a, b) => b.openTasks - a.openTasks)
    .slice(0, 12)

  let approved = 0
  let rejected = 0
  for (const row of approvalCounts) {
    if (row.status === ApprovalStatus.APPROVED) approved = row._count._all
    if (row.status === ApprovalStatus.REJECTED) rejected = row._count._all
  }

  const cycleMs = doneTasksForCycle
    .map((t) => t.updatedAt.getTime() - t.createdAt.getTime())
    .filter((ms) => ms > 0)
  const avgCycleTimeDaysDone =
    cycleMs.length > 0
      ? cycleMs.reduce((a, b) => a + b, 0) / cycleMs.length / (1000 * 60 * 60 * 24)
      : null

  return {
    totals: {
      tasks: totalTasks,
      tasksDone,
      projectsActive,
      projectsArchived,
      overdueTasks,
      pendingApprovals,
      invitesOutstanding,
      membersActive,
    },
    tasksByStatus,
    workloadByAssignee,
    overdueSamples: overdueSamples.map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate,
      assigneeName: t.assignee?.name ?? null,
      projectTitle: t.project.title,
      projectId: t.projectId,
    })),
    approvals: {
      pending: pendingApprovals,
      approved,
      rejected,
    },
    avgCycleTimeDaysDone,
  }
}
