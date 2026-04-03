'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { submitTaskForApprovalAction } from '@/app/workspace/[workspaceId]/actions'
import { Card } from '@/components/layout/page-components'
import { cn } from '@/lib/utils'

interface SubmitTaskForApprovalFormProps {
  workspaceId: string
  projectId: string
  taskId: string
  taskTitle: string
}

function fieldErrors(
  details: { fieldErrors?: Record<string, string[] | undefined> } | undefined
): string | null {
  if (!details?.fieldErrors) return null
  const parts = Object.entries(details.fieldErrors)
    .flatMap(([k, v]) => (v?.length ? [`${k}: ${v.join(', ')}`] : []))
  return parts.length ? parts.join(' · ') : null
}

export function SubmitTaskForApprovalForm({
  workspaceId,
  projectId,
  taskId,
  taskTitle,
}: SubmitTaskForApprovalFormProps) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(
    submitTaskForApprovalAction,
    null
  )
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    if (state?.ok) {
      handled.current = true
      router.push(`/workspace/${workspaceId}/projects/${projectId}/tasks/${taskId}`)
      router.refresh()
    }
  }, [state, router, workspaceId, projectId, taskId])

  return (
    <Card className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Submit for approval</h2>
        <p className="text-sm text-gray-600">
          Submitting &quot;<strong>{taskTitle}</strong>&quot; for review. A manager or owner will
          approve or reject your submission.
        </p>
      </div>

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="workspaceId" value={workspaceId} />
        <input type="hidden" name="taskId" value={taskId} />

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
            htmlFor="submitNote"
            className="block text-sm font-medium text-gray-900 mb-2"
          >
            Submission notes (optional)
          </label>
          <textarea
            id="submitNote"
            name="submitNote"
            placeholder="Add any notes for the reviewer"
            disabled={isPending}
            rows={4}
            maxLength={500}
            className={cn(
              'w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-900',
              'focus:ring-2 focus:ring-black focus:border-transparent outline-none',
              'disabled:bg-gray-50 disabled:text-gray-500'
            )}
          />
          <p className="text-xs text-gray-500 mt-1">Max 500 characters</p>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending}
            className={cn(
              'px-6 py-2 rounded-lg font-semibold transition-colors',
              'bg-black text-white hover:bg-gray-900',
              'disabled:bg-gray-400 disabled:cursor-not-allowed'
            )}
          >
            {isPending ? 'Submitting...' : 'Submit for approval'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isPending}
            className={cn(
              'px-6 py-2 rounded-lg font-semibold transition-colors',
              'bg-gray-100 text-gray-900 hover:bg-gray-200',
              'disabled:bg-gray-100 disabled:cursor-not-allowed'
            )}
          >
            Cancel
          </button>
        </div>
      </form>
    </Card>
  )
}
