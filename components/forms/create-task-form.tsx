'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { createTaskAction } from '@/app/workspace/[workspaceId]/actions'
import { Card } from '@/components/layout/page-components'
import { cn } from '@/lib/utils'

interface Member {
  id: string
  name: string
  email: string
}

interface CreateTaskFormProps {
  workspaceId: string
  projectId: string
  members: Member[]
}

function fieldErrors(
  details: { fieldErrors?: Record<string, string[] | undefined> } | undefined
): string | null {
  if (!details?.fieldErrors) return null
  const parts = Object.entries(details.fieldErrors)
    .flatMap(([k, v]) => (v?.length ? [`${k}: ${v.join(', ')}`] : []))
  return parts.length ? parts.join(' · ') : null
}

export function CreateTaskForm({
  workspaceId,
  projectId,
  members,
}: CreateTaskFormProps) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(createTaskAction, null)
  const lastTaskId = useRef<string | null>(null)

  useEffect(() => {
    if (state?.ok && 'taskId' in state && state.taskId && state.taskId !== lastTaskId.current) {
      lastTaskId.current = state.taskId
      router.refresh()
      router.push(
        `/workspace/${workspaceId}/projects/${projectId}/tasks/${state.taskId}`
      )
    }
  }, [state, router, workspaceId, projectId])

  return (
    <Card>
      <form action={formAction} className="max-w-2xl space-y-6">
        <input type="hidden" name="workspaceId" value={workspaceId} />
        <input type="hidden" name="projectId" value={projectId} />

        {!state?.ok && state?.error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
            {state.error}
            {state && 'details' in state && fieldErrors(state.details as { fieldErrors?: Record<string, string[] | undefined> }) && (
              <p className="mt-2 text-xs">
                {fieldErrors(state.details as { fieldErrors?: Record<string, string[] | undefined> })}
              </p>
            )}
          </div>
        )}

        {state?.ok && 'message' in state && state.message && (
          <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700 border border-green-200">
            {state.message}
          </div>
        )}

        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-900 mb-2"
          >
            Task Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            placeholder="e.g., Design homepage hero section"
            required
            minLength={3}
            disabled={isPending}
            className={cn(
              'w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-900',
              'focus:ring-2 focus:ring-black focus:border-transparent outline-none',
              'disabled:bg-gray-50 disabled:text-gray-500',
              'placeholder:text-gray-400'
            )}
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-900 mb-2"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            placeholder="Add task details..."
            rows={4}
            disabled={isPending}
            className={cn(
              'w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-900',
              'focus:ring-2 focus:ring-black focus:border-transparent outline-none',
              'disabled:bg-gray-50 disabled:text-gray-500',
              'placeholder:text-gray-400 resize-none'
            )}
          />
        </div>

        <div>
          <label
            htmlFor="assigneeId"
            className="block text-sm font-medium text-gray-900 mb-2"
          >
            Assign to
          </label>
          <select
            id="assigneeId"
            name="assigneeId"
            disabled={isPending}
            className={cn(
              'w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-900',
              'focus:ring-2 focus:ring-black focus:border-transparent outline-none',
              'disabled:bg-gray-50 disabled:text-gray-500',
              'bg-white'
            )}
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name || member.email}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Only active or invited workspace members are listed.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Priority
          </label>
          <div className="flex flex-wrap gap-3">
            {(
              [
                { value: 'LOW', label: 'Low', color: 'bg-blue-100 text-blue-700' },
                { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
                { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800' },
                { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-700' },
              ] as const
            ).map((p) => (
              <label
                key={p.value}
                className="relative flex cursor-pointer items-center"
              >
                <input
                  type="radio"
                  name="priority"
                  value={p.value}
                  defaultChecked={p.value === 'MEDIUM'}
                  disabled={isPending}
                  className="radio radio-sm"
                />
                <span
                  className={cn(
                    'ml-2 px-3 py-1 rounded-full text-sm font-medium',
                    p.color
                  )}
                >
                  {p.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="dueDate"
            className="block text-sm font-medium text-gray-900 mb-2"
          >
            Due date
          </label>
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            disabled={isPending}
            className={cn(
              'w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-900',
              'focus:ring-2 focus:ring-black focus:border-transparent outline-none',
              'disabled:bg-gray-50'
            )}
          />
        </div>

        <div className="rounded-lg border border-gray-200 p-4 space-y-3">
          <p className="text-sm font-medium text-gray-900">Approval</p>
          <p className="text-xs text-gray-500">
            When enabled, the assignee must submit for review before the task can be completed.
          </p>
          <div className="flex flex-col gap-2 text-sm text-gray-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="requiresApproval"
                value="true"
                defaultChecked
                disabled={isPending}
                className="w-4 h-4"
              />
              Require approval
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="requiresApproval"
                value="false"
                disabled={isPending}
                className="w-4 h-4"
              />
              No approval required
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className={cn(
            'w-full px-4 py-3 rounded-lg font-semibold text-white',
            'bg-black hover:bg-gray-900 transition-colors',
            'disabled:bg-gray-400 disabled:cursor-not-allowed',
            'focus:ring-2 focus:ring-black focus:ring-offset-2 outline-none'
          )}
        >
          {isPending ? 'Creating...' : 'Create Task'}
        </button>
      </form>
    </Card>
  )
}
