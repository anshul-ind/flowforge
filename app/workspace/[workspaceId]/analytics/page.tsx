import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { AnalyticsService } from '@/modules/analytics/service';
import { WorkloadChart } from '@/components/analytics/workload-chart';
import { TasksByStatusChart } from '@/components/analytics/tasks-by-status-chart';
import { OverdueTasksList } from '@/components/analytics/overdue-tasks-list';
import { CycleTimeChart } from '@/components/analytics/cycle-time-chart';
import { ApprovalTurnaroundChart } from '@/components/analytics/approval-turnaround-chart';

interface AnalyticsPageProps {
  params: {
    workspaceId: string;
  };
}

/**
 * Analytics Dashboard Page
 * Server-side aggregation of all analytics data
 */
export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/login');
  }

  const { workspaceId } = params;

  // Validate workspace access and get tenant context
  const tenant = await resolveTenantContext(workspaceId, session.user.id);
  if (!tenant) {
    notFound();
  }

  // Get all analytics data in parallel
  const analyticsService = new AnalyticsService(tenant);
  const dashboardData = await analyticsService.getDashboardData();

  if (!dashboardData) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Unable to load analytics data</p>
      </div>
    );
  }

  const {
    tasksByStatus,
    overdueTasks,
    cycleTime,
    workload,
    approvals,
    metrics: overallMetrics
  } = dashboardData;

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-2">Performance metrics and team statistics</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Total Tasks</p>
          <p className="text-3xl font-bold text-gray-900">{overallMetrics.totalTasks}</p>
          <p className="text-xs text-gray-500 mt-2">across all projects</p>
        </div>

        {/* Completed Tasks */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Completed</p>
          <p className="text-3xl font-bold text-green-600">{overallMetrics.completedTasks}</p>
          <p className="text-xs text-gray-500 mt-2">
            {overallMetrics.totalTasks > 0
              ? Math.round((overallMetrics.completedTasks / overallMetrics.totalTasks) * 100)
              : 0}
            % completion
          </p>
        </div>

        {/* Open Tasks */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Open Tasks</p>
          <p className="text-3xl font-bold text-blue-600">{overallMetrics.openTasks}</p>
          <p className="text-xs text-gray-500 mt-2">awaiting completion</p>
        </div>

        {/* Overdue Count */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Overdue</p>
          <p className={`text-3xl font-bold ${overallMetrics.overdueTasks > 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {overallMetrics.overdueTasks}
          </p>
          <p className="text-xs text-gray-500 mt-2">require attention</p>
        </div>
      </div>

      {/* Tasks by Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Tasks by Status</h2>
          <p className="text-sm text-gray-600">Distribution across all statuses</p>
        </div>
        <TasksByStatusChart data={tasksByStatus} />
      </div>

      {/* Workload Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Team Workload</h2>
          <p className="text-sm text-gray-600">Open tasks per assignee</p>
        </div>
        <WorkloadChart data={workload} workspaceId={workspaceId} />
      </div>

      {/* Cycle Time */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Cycle Time</h2>
          <p className="text-sm text-gray-600">Average days to completion per project</p>
        </div>
        <CycleTimeChart data={cycleTime} />
      </div>

      {/* Approval Turnaround */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Approval Turnaround</h2>
          <p className="text-sm text-gray-600">Reviewer metrics and response times</p>
        </div>
        <ApprovalTurnaroundChart data={approvals} />
      </div>

      {/* Overdue Tasks List */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Overdue Tasks</h2>
          <p className="text-sm text-gray-600">Tasks past their due date</p>
        </div>
        <OverdueTasksList tasks={overdueTasks} workspaceId={workspaceId} />
      </div>
    </div>
  );
}
