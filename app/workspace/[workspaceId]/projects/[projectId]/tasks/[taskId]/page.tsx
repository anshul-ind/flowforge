import Link from 'next/link'
import { requireUser } from '@/lib/auth/require-user'
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant'
import { prisma } from '@/lib/db'
import { canReviewApproval } from '@/lib/permissions'
import { PageHeader, PageContainer, Card } from '@/components/layout/page-components'
import { SubmitTaskForApprovalForm } from '@/components/forms/submit-task-for-approval-form'
import { ApprovalReviewForm } from '@/components/forms/approval-review-form'
import { TaskCommentsSection } from '@/components/task/task-comments-section'
import { canComment } from '@/lib/permissions'

interface TaskDetailPageProps {
  params: Promise<{ workspaceId: string; projectId: string; taskId: string }>
}

export async function generateMetadata({ params }: TaskDetailPageProps) {
  const { taskId } = await params
  return { title: `Task ${taskId.slice(0, 8)}…` }
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { workspaceId, projectId, taskId } = await params
  const user = await requireUser()
  const tenant = await resolveTenantContext(workspaceId, user.id)

  if (!tenant) {
    return <div className="p-6">Access denied</div>
  }

  const task = await prisma.task.findFirst({
    where: { id: taskId, workspaceId, projectId },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, title: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  })

  if (!task) {
    return <div className="p-6">Task not found</div>
  }

  const pendingApproval = await prisma.approvalRequest.findFirst({
    where: {
      taskId: task.id,
      workspaceId,
      status: 'PENDING',
    },
    include: {
      submitter: { select: { name: true, email: true } },
    },
  })

  const canSubmit =
    task.requiresApproval &&
    task.assigneeId === user.id &&
    task.status !== 'DONE' &&
    task.status !== 'IN_REVIEW' &&
    !pendingApproval

  const canReviewThis =
    pendingApproval &&
    canReviewApproval(tenant.role) &&
    (!pendingApproval.reviewerId || pendingApproval.reviewerId === user.id)

  return (
    <PageContainer>
      <PageHeader
        title={task.title}
        description={task.project.title}
        breadcrumbs={[
          { label: 'Workspace', href: `/workspace/${workspaceId}` },
          { label: 'Projects', href: `/workspace/${workspaceId}/projects` },
          {
            label: task.project.title,
            href: `/workspace/${workspaceId}/projects/${projectId}`,
          },
          {
            label: 'Tasks',
            href: `/workspace/${workspaceId}/projects/${projectId}/tasks`,
          },
          { label: task.title },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
        <Card className="space-y-4">
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="px-2 py-1 rounded-md bg-gray-100 font-medium text-gray-800">
              {task.status.replace('_', ' ')}
            </span>
            <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700">
              {task.priority}
            </span>
            {task.requiresApproval && (
              <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200">
                Approval required
              </span>
            )}
          </div>

          {task.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Description</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-gray-500">Assignee</dt>
              <dd className="font-medium text-gray-900">
                {task.assignee
                  ? task.assignee.name || task.assignee.email
                  : 'Unassigned'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Created by</dt>
              <dd className="font-medium text-gray-900">
                {task.createdBy.name || task.createdBy.email}
              </dd>
            </div>
            {task.dueDate && (
              <div>
                <dt className="text-gray-500">Due</dt>
                <dd className="font-medium text-gray-900">
                  {task.dueDate.toLocaleDateString()}
                </dd>
              </div>
            )}
          </dl>

          <Link
            href={`/workspace/${workspaceId}/projects/${projectId}/tasks`}
            className="inline-block text-sm font-medium text-gray-700 hover:text-black"
          >
            ← Back to tasks
          </Link>
        </Card>

        {canComment(tenant.role) && (
          <TaskCommentsSection workspaceId={workspaceId} taskId={task.id} />
        )}
        </div>

        <div className="space-y-6">
          {canSubmit && (
            <SubmitTaskForApprovalForm
              workspaceId={workspaceId}
              projectId={projectId}
              taskId={task.id}
              taskTitle={task.title}
            />
          )}

          {canReviewThis && pendingApproval && (
            <ApprovalReviewForm
              workspaceId={workspaceId}
              projectId={projectId}
              approvalId={pendingApproval.id}
              taskTitle={task.title}
              submittedByName={
                pendingApproval.submitter?.name ||
                pendingApproval.submitter?.email ||
                undefined
              }
              submitNote={pendingApproval.submitNote}
            />
          )}

          {task.status === 'IN_REVIEW' && !canSubmit && !canReviewThis && (
            <Card>
              <p className="text-sm text-gray-600">
                This task is waiting for approval from a manager or owner.
              </p>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  )
}
