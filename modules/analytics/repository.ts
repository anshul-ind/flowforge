import { prisma } from '@/lib/db';
import { TenantContext } from '@/lib/tenant/tenant-context';
import { TaskStatus } from '@/lib/generated/prisma';

/**
 * Analytics Repository
 * Aggregates data from database using Prisma groupBy and count
 * All calculations are server-side for performance
 */
export class AnalyticsRepository {
  constructor(private tenant: TenantContext) {}

  /**
   * Get task counts by status
   */
  async getTasksByStatus() {
    // @ts-ignore - Prisma groupBy typing issue with orderBy
    const results = await prisma.task.groupBy({
      by: ['status'],
      where: { workspaceId: this.tenant.workspaceId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    return results.map(r => ({
      status: r.status,
      count: r._count.id,
    }));
  }

  /**
   * Get overdue tasks with project and assignee info
   */
  async getOverdueTasks(limit = 100) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasks = await prisma.task.findMany({
      where: {
        workspaceId: this.tenant.workspaceId,
        dueDate: { lt: today },
        status: { not: 'DONE' },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        status: true,
        project: { select: { name: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: limit,
    });

    // Type guard to ensure dueDate is not null
    return tasks.filter((t): t is typeof t & { dueDate: Date } => t.dueDate !== null);
  }

  /**
   * Calculate cycle time (in days) for completed tasks by project
   * Only counts tasks that reached DONE status
   */
  async getCycleTimeByProject() {
    const tasks = await prisma.task.findMany({
      where: {
        workspaceId: this.tenant.workspaceId,
        status: 'DONE',
      },
      select: {
        id: true,
        createdAt: true,
        statusChangedAt: true, // Will need migration if not present
        projectId: true,
        project: { select: { name: true } },
      },
    });

    // Group by project and calculate average cycle time
    const grouped: Record<
      string,
      { projectId: string; projectName: string; cycleTimes: number[] }
    > = {};

    for (const task of tasks) {
      if (!grouped[task.projectId]) {
        grouped[task.projectId] = {
          projectId: task.projectId,
          projectName: task.project.name,
          cycleTimes: [],
        };
      }

      const cycleTimeMs = (task.statusChangedAt?.getTime() || Date.now()) - task.createdAt.getTime();
      const cycleTimeDays = Math.ceil(cycleTimeMs / (1000 * 60 * 60 * 24));
      grouped[task.projectId].cycleTimes.push(cycleTimeDays);
    }

    return Object.values(grouped).map(g => ({
      projectId: g.projectId,
      projectName: g.projectName,
      avgCycleTimeDays: Math.round(
        g.cycleTimes.reduce((a, b) => a + b, 0) / g.cycleTimes.length
      ),
      taskCount: g.cycleTimes.length,
    }));
  }

  /**
   * Get workload by assignee (open tasks only)
   */
  async getWorkloadByAssignee() {
    // @ts-ignore - Prisma groupBy typing issue with orderBy
    const results = await prisma.task.groupBy({
      by: ['assigneeId'],
      where: {
        workspaceId: this.tenant.workspaceId,
        status: { not: 'DONE' },
        assigneeId: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const assigneeIds = results
      .map(r => r.assigneeId)
      .filter((id): id is string => id !== null);

    const assignees = await prisma.user.findMany({
      where: { id: { in: assigneeIds } },
      select: { id: true, name: true, email: true },
    });

    const assigneeMap = Object.fromEntries(assignees.map(a => [a.id, a]));

    return results
      .map(r => ({
        assigneeId: r.assigneeId!,
        assigneeName: assigneeMap[r.assigneeId!]?.name || 'Unknown',
        assigneeEmail: assigneeMap[r.assigneeId!]?.email || '',
        openTaskCount: r._count.id,
      }))
      .sort((a, b) => b.openTaskCount - a.openTaskCount);
  }

  /**
   * Get approval turnaround metrics by reviewer
   * Requires approvals table/data
   */
  async getApprovalTurnaroundByReviewer() {
    // This assumes approvals are tracked in database
    // If not present, return empty for now
    const approvals = await (prisma as any).approval?.groupBy?.({
      by: ['reviewerId'],
      where: { workspaceId: this.tenant.workspaceId },
      _avg: { responseTimeMinutes: true },
      _count: { id: true },
    });

    if (!approvals || approvals.length === 0) {
      return [];
    }

    const reviewerIds = approvals
      .map((a: any) => a.reviewerId)
      .filter((id: string) => id);

    const reviewers = await prisma.user.findMany({
      where: { id: { in: reviewerIds } },
      select: { id: true, name: true },
    });

    const reviewerMap = Object.fromEntries(reviewers.map(r => [r.id, r]));

    return approvals.map((a: any) => ({
      reviewerId: a.reviewerId,
      reviewerName: reviewerMap[a.reviewerId]?.name || 'Unknown',
      avgResponseTimeMinutes: Math.round(a._avg.responseTimeMinutes || 0),
      totalApprovals: a._count.id,
    }));
  }

  /**
   * Get overall metrics for metric cards
   */
  async getOverallMetrics(dateRangeStart?: Date, dateRangeEnd?: Date) {
    const where: any = { workspaceId: this.tenant.workspaceId };

    if (dateRangeStart || dateRangeEnd) {
      where.createdAt = {};
      if (dateRangeStart) where.createdAt.gte = dateRangeStart;
      if (dateRangeEnd) where.createdAt.lte = dateRangeEnd;
    }

    // Total tasks
    const totalTasks = await prisma.task.count({ where });

    // Completed tasks
    const completedTasks = await prisma.task.count({
      where: { ...where, status: 'DONE' },
    });

    // Overdue tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueTasks = await prisma.task.count({
      where: {
        ...where,
        dueDate: { lt: today },
        status: { not: 'DONE' },
      },
    });

    // Average cycle time (only DONE tasks)
    const doneTasks = await prisma.task.findMany({
      where: { ...where, status: 'DONE' },
      select: {
        createdAt: true,
        statusChangedAt: true,
      },
    });

    let avgCycleTime = 0;
    if (doneTasks.length > 0) {
      const cycleTimes = doneTasks.map(t => {
        const cycleTimeMs = (t.statusChangedAt?.getTime() || Date.now()) - t.createdAt.getTime();
        return Math.ceil(cycleTimeMs / (1000 * 60 * 60 * 24));
      });
      avgCycleTime = Math.round(cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length);
    }

    // Approval TAT (if approvals exist)
    let avgApprovalTAT = 0;
    const approvals = await (prisma as any).approval?.findMany?.({
      where: { workspaceId: this.tenant.workspaceId },
      select: { responseTimeMinutes: true },
    });

    if (approvals && approvals.length > 0) {
      const totalMinutes = approvals.reduce((sum: number, a: any) => sum + (a.responseTimeMinutes || 0), 0);
      avgApprovalTAT = Math.round(totalMinutes / approvals.length);
    }

    return {
      totalTasks,
      completedTasks,
      openTasks: totalTasks - completedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      overdueTasks,
      avgCycleTimeDays: avgCycleTime,
      avgApprovalTATMinutes: avgApprovalTAT,
    };
  }
}
