import { TenantContext } from '@/lib/tenant/tenant-context';
import { AnalyticsRepository } from './repository';

/**
 * Analytics Service
 * Provides business logic for analytics data
 * All aggregation happens in repository (server-side)
 */
export class AnalyticsService {
  private repository: AnalyticsRepository;

  constructor(tenant: TenantContext) {
    this.repository = new AnalyticsRepository(tenant);
  }

  /**
   * Get all analytics data for dashboard
   */
  async getDashboardData(dateRangeStart?: Date, dateRangeEnd?: Date) {
    const [metrics, tasksByStatus, overdueTasks, cycleTime, workload, approvals] =
      await Promise.all([
        this.repository.getOverallMetrics(dateRangeStart, dateRangeEnd),
        this.repository.getTasksByStatus(),
        this.repository.getOverdueTasks(20),
        this.repository.getCycleTimeByProject(),
        this.repository.getWorkloadByAssignee(),
        this.repository.getApprovalTurnaroundByReviewer(),
      ]);

    return {
      metrics,
      tasksByStatus,
      overdueTasks,
      cycleTime,
      workload,
      approvals,
      generatedAt: new Date(),
    };
  }

  /**
   * Get metrics for metric cards only
   */
  async getMetricsOnly(dateRangeStart?: Date, dateRangeEnd?: Date) {
    return this.repository.getOverallMetrics(dateRangeStart, dateRangeEnd);
  }

  /**
   * Get tasks by status for chart
   */
  async getTasksByStatusChart() {
    return this.repository.getTasksByStatus();
  }

  /**
   * Get overdue tasks with pagination info
   */
  async getOverdueTasksWithPagination(page = 1, pageSize = 10) {
    const tasks = await this.repository.getOverdueTasks(pageSize * page);
    const paginated = tasks.slice((page - 1) * pageSize, page * pageSize);

    return {
      tasks: paginated,
      page,
      pageSize,
      total: tasks.length,
      hasMore: tasks.length > page * pageSize,
    };
  }

  /**
   * Get cycle time data for chart
   */
  async getCycleTimeForChart() {
    return this.repository.getCycleTimeByProject();
  }

  /**
   * Get workload data for chart
   */
  async getWorkloadForChart() {
    return this.repository.getWorkloadByAssignee();
  }

  /**
   * Get approval metrics for chart
   */
  async getApprovalMetrics() {
    return this.repository.getApprovalTurnaroundByReviewer();
  }

  /**
   * Export data as CSV
   */
  exportAsCSV(section: 'tasks' | 'approvals' | 'full', data: any) {
    if (section === 'tasks') {
      return this.exportTasksCSV(data);
    } else if (section === 'approvals') {
      return this.exportApprovalsCSV(data);
    } else {
      return this.exportFullReportCSV(data);
    }
  }

  private exportTasksCSV(overdueTasks: any[]): string {
    const headers = ['Title', 'Project', 'Assignee', 'Due Date', 'Days Overdue', 'Status'];
    const rows = overdueTasks.map(task => {
      const now = new Date();
      const daysOverdue = Math.floor(
        (now.getTime() - task.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return [
        task.title,
        task.project.name,
        task.assignee?.name || 'Unassigned',
        task.dueDate.toISOString().split('T')[0],
        daysOverdue,
        task.status,
      ];
    });

    return [
      headers.join(','),
      ...rows.map(row => row.map(v => `"${v}"`).join(',')),
    ].join('\n');
  }

  private exportApprovalsCSV(approvals: any[]): string {
    const headers = ['Reviewer', 'Avg Response Time (min)', 'Total Approvals', 'Approval Rate'];
    const rows = approvals.map(a => [
      a.reviewerName,
      a.avgResponseTimeMinutes,
      a.totalApprovals,
      ((a.totalApprovals / (a.totalApprovals + 10)) * 100).toFixed(1) + '%', // Placeholder calc
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(v => `"${v}"`).join(',')),
    ].join('\n');
  }

  private exportFullReportCSV(data: any): string {
    const sections = [];

    // Metrics section
    const metricsHeaders = ['Metric', 'Value'];
    const metricsRows = [
      ['Total Tasks', data.metrics.totalTasks],
      ['Completed Tasks', data.metrics.completedTasks],
      ['Completion Rate', data.metrics.completionRate + '%'],
      ['Overdue Tasks', data.metrics.overdueTasks],
      ['Avg Cycle Time (days)', data.metrics.avgCycleTimeDays],
      ['Avg Approval TAT (min)', data.metrics.avgApprovalTATMinutes],
    ];
    sections.push([metricsHeaders.join(','), ...metricsRows.map((r: any[]) => r.join(','))].join('\n'));

    // Tasks by status
    sections.push('');
    const statusHeaders = ['Status', 'Count'];
    const statusRows = data.tasksByStatus.map((s: any) => [s.status, s.count]);
    sections.push(
      [statusHeaders.join(','), ...statusRows.map((r: any[]) => r.join(','))].join('\n')
    );

    // Overdue tasks
    sections.push('');
    const overdueHeaders = ['Title', 'Project', 'Assignee', 'Due Date', 'Days Overdue'];
    const overdueRows = data.overdueTasks.map((t: any) => {
      const daysOverdue = Math.floor(
        (new Date().getTime() - t.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return [t.title, t.project.name, t.assignee?.name || 'Unassigned', 
              t.dueDate.toISOString().split('T')[0], daysOverdue];
    });
    sections.push(
      [overdueHeaders.join(','), ...overdueRows.map((r: any[]) => r.map((v: any) => `"${v}"`).join(','))].join('\n')
    );

    return sections.join('\n\n');
  }
}
