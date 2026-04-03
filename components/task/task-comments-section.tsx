import { Card } from '@/components/layout/page-components'
import { CommentForm } from '@/components/forms/comment-form'
import { getTaskCommentsWithAuthorRoles } from '@/lib/queries/task-comments'
import { formatDistanceToNow } from 'date-fns'

export async function TaskCommentsSection({
  workspaceId,
  taskId,
}: {
  workspaceId: string
  taskId: string
}) {
  const comments = await getTaskCommentsWithAuthorRoles(workspaceId, taskId)

  return (
    <Card className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Comments ({comments.length})
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Use @ plus a teammate&apos;s name (no spaces) or email prefix to mention them.
        </p>
      </div>

      <CommentForm workspaceId={workspaceId} taskId={taskId} />

      <ul className="space-y-4 divide-y divide-gray-100">
        {comments.length === 0 ? (
          <li className="pt-2 text-sm text-gray-500">No comments yet.</li>
        ) : (
          comments.map((c) => (
            <li key={c.id} className="pt-4 first:pt-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {c.author.name || c.author.email}
                  </span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                    {c.authorRole}
                  </span>
                </div>
                <time
                  dateTime={c.createdAt.toISOString()}
                  className="text-xs text-gray-500"
                  title={c.createdAt.toLocaleString()}
                >
                  {formatDistanceToNow(c.createdAt, { addSuffix: true })}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                {c.body}
              </p>
            </li>
          ))
        )}
      </ul>
    </Card>
  )
}
