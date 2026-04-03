'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { reviewApprovalAction } from '@/app/workspace/[workspaceId]/actions'
import { Card } from '@/components/layout/page-components'
import { cn } from '@/lib/utils'

interface ApprovalReviewFormProps {
  workspaceId: string
  projectId: string
  approvalId: string
  taskTitle: string
  submittedByName?: string
  submitNote?: string | null
}

function fieldErrors(
  details: { fieldErrors?: Record<string, string[] | undefined> } | undefined
): string | null {
  if (!details?.fieldErrors) return null
  const parts = Object.entries(details.fieldErrors)
    .flatMap(([k, v]) => (v?.length ? [`${k}: ${v.join(', ')}`] : []))
  return parts.length ? parts.join(' · ') : null
}

export function ApprovalReviewForm({
  workspaceId,
  projectId,
  approvalId,
  taskTitle,
  submittedByName,
  submitNote,
}: ApprovalReviewFormProps) {
  const router = useRouter()
  const [decision, setDecision] = useState<'APPROVE' | 'REJECT' | null>(null)
  const [state, formAction, isPending] = useActionState(reviewApprovalAction, null)
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    if (state?.ok) {
      handled.current = true
      router.push(`/workspace/${workspaceId}/projects/${projectId}/tasks`)
      router.refresh()
    }
  }, [state, router, workspaceId, projectId])

  return (
    <Card className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Review submission</h2>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-medium">Task:</span> {taskTitle}
          </p>
          {submittedByName && (
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Submitted by:</span> {submittedByName}
            </p>
          )}
          {submitNote && (
            <>
              <p className="text-sm font-medium text-gray-600 mb-1">Submission notes</p>
              <p className="text-sm text-gray-600 italic">&quot;{submitNote}&quot;</p>
            </>
          )}
        </div>
      </div>

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="workspaceId" value={workspaceId} />
        <input type="hidden" name="approvalId" value={approvalId} />

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
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Decision
          </label>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="decision"
                value="APPROVE"
                checked={decision === 'APPROVE'}
                onChange={() => setDecision('APPROVE')}
                disabled={isPending}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-900">Approve — mark task done</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="decision"
                value="REJECT"
                checked={decision === 'REJECT'}
                onChange={() => setDecision('REJECT')}
                disabled={isPending}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-900">Reject — send back for revision</span>
            </label>
          </div>
        </div>

        {decision === 'REJECT' && (
          <div>
            <label
              htmlFor="rejectionReason"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Reason for rejection <span className="text-red-600">*</span>
            </label>
            <textarea
              id="rejectionReason"
              name="rejectionReason"
              placeholder="Explain what needs to change"
              disabled={isPending}
              rows={4}
              required
              className={cn(
                'w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-900',
                'focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none',
                'disabled:bg-gray-50 disabled:text-gray-500'
              )}
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending || !decision}
            className={cn(
              'px-6 py-2 rounded-lg font-semibold transition-colors',
              decision === 'APPROVE'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : decision === 'REJECT'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isPending ? 'Processing...' : decision === 'APPROVE' ? 'Approve' : 'Reject'}
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
