import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireUser } from '@/lib/auth/require-user'
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant'
import { canAccessWorkspaceAnalytics } from '@/lib/permissions'
import { getWorkspaceAnalyticsSnapshot } from '@/lib/queries/workspace-analytics'
import { BarChart, TrendingUp, Calendar, Users, AlertCircle } from 'lucide-react'
import { TasksByStatusChart } from '@/components/analytics/tasks-by-status-chart'
import { WorkloadChart } from '@/components/analytics/workload-chart'

interface AnalyticsPageProps {
  params: Promise<{ workspaceId: string }>
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { workspaceId } = await params
  const user = await requireUser()
  const tenant = await resolveTenantContext(workspaceId, user.id)

  if (!tenant) {
    notFound()
  }

  if (!canAccessWorkspaceAnalytics(tenant.role)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-lg border border-danger-300 bg-danger-50 p-8 text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-danger" />
          <h2 className="mb-2 text-lg font-semibold text-primary">Access Denied</h2>
          <p className="text-secondary">Only workspace owners can access the analytics dashboard.</p>
        </div>
      </div>
    )
  }

  const data = await getWorkspaceAnalyticsSnapshot(workspaceId)
  const maxStatus = Math.max(...data.tasksByStatus.map((t) => t.count), 1)
  const completionPct =
    data.totals.tasks > 0 ? Math.round((data.totals.tasksDone / data.totals.tasks) * 100) : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary">Analytics</h1>
        <p className="mt-2 text-secondary">Workspace execution and delivery (tenant-scoped)</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-secondary">Total tasks</p>
              <p className="text-3xl font-bold text-primary">{data.totals.tasks}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
              <BarChart size={20} className="text-brand" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-secondary">Completed</p>
              <p className="text-3xl font-bold text-primary">{data.totals.tasksDone}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <TrendingUp size={20} className="text-success" />
            </div>
          </div>
          <p className="mt-2 text-xs text-tertiary">{completionPct}% of all tasks</p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-secondary">Overdue</p>
              <p className="text-3xl font-bold text-danger">{data.totals.overdueTasks}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger/10">
              <AlertCircle size={20} className="text-danger" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-secondary">Avg. cycle (done)</p>
              <p className="text-3xl font-bold text-primary">
                {data.avgCycleTimeDaysDone != null
                  ? `${data.avgCycleTimeDaysDone.toFixed(1)}d`
                  : '—'}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
              <Calendar size={20} className="text-info" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="mb-2 flex items-center gap-2">
            <Users size={18} className="text-secondary" />
            <p className="text-sm font-medium text-secondary">Active members</p>
          </div>
          <p className="text-2xl font-bold text-primary">{data.totals.membersActive}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-6">
          <p className="mb-2 text-sm font-medium text-secondary">Open projects</p>
          <p className="text-2xl font-bold text-primary">{data.totals.projectsActive}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-6">
          <p className="mb-2 text-sm font-medium text-secondary">Archived projects</p>
          <p className="text-2xl font-bold text-primary">{data.totals.projectsArchived}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-6 text-lg font-semibold text-primary">Tasks by status</h2>
          <TasksByStatusChart rows={data.tasksByStatus} maxCount={maxStatus} />
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-6 text-lg font-semibold text-primary">Workload by assignee</h2>
          <WorkloadChart rows={data.workloadByAssignee} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold text-primary">Approvals</h2>
          <ul className="space-y-2 text-sm text-secondary">
            <li>Pending: <span className="font-semibold text-primary">{data.approvals.pending}</span></li>
            <li>Approved: <span className="font-semibold text-primary">{data.approvals.approved}</span></li>
            <li>Rejected: <span className="font-semibold text-primary">{data.approvals.rejected}</span></li>
          </ul>
          <p className="mt-3 text-xs text-tertiary">
            Pending invites (open links): {data.totals.invitesOutstanding}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold text-primary">Overdue tasks</h2>
          {data.overdueSamples.length === 0 ? (
            <p className="text-center text-tertiary py-6">No overdue tasks.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {data.overdueSamples.map((t) => (
                <li key={t.id} className="py-3">
                  <Link
                    href={`/workspace/${workspaceId}/projects/${t.projectId}/tasks/${t.id}`}
                    className="font-medium text-brand hover:underline"
                  >
                    {t.title}
                  </Link>
                  <p className="text-xs text-tertiary">
                    {t.projectTitle}
                    {t.assigneeName ? ` · ${t.assigneeName}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
