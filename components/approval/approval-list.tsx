'use client'

import { ApprovalRequest } from '@/lib/generated/prisma'
import { useState, useEffect, useCallback } from 'react'
import { listWorkspaceApprovalsForClient } from '@/modules/approval/list-workspace-approvals'

interface ApprovalsListProps {
  workspaceId: string
  currentUserId: string
}

export function ApprovalsList({ workspaceId, currentUserId }: ApprovalsListProps) {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadApprovals = useCallback(async () => {
    try {
      setError(null)
      const loaded = await listWorkspaceApprovalsForClient(workspaceId)
      setApprovals(loaded)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load approvals')
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    loadApprovals()
  }, [loadApprovals])

  if (isLoading) {
    return <div className="text-gray-500">Loading approvals...</div>
  }

  const pending = approvals.filter((a) => a.status === 'PENDING')
  const completed = approvals.filter((a) => a.status !== 'PENDING')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {error && <div className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div>
        <h3 className="mb-3 font-semibold text-gray-900">
          Pending Approvals ({pending.length})
        </h3>
        <div className="space-y-2">
          {pending.length === 0 ? (
            <p className="text-sm text-gray-500">No pending approvals</p>
          ) : (
            pending.map((approval) => {
              const isReviewer = approval.reviewerId === currentUserId
              return (
                <div key={approval.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Approval Request</p>
                      <p className="mt-1 text-xs text-gray-500">Task ID: {approval.taskId}</p>
                    </div>
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${getStatusColor(approval.status)}`}
                    >
                      {approval.status}
                    </span>
                  </div>

                  {expandedId === approval.id && (
                    <div className="rounded bg-blue-50 p-3">
                      <p className="mb-3 text-sm text-gray-700">
                        {approval.submitNote || 'No notes'}
                      </p>
                      {isReviewer ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="flex-1 rounded bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="flex-1 rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">Awaiting review...</p>
                      )}
                    </div>
                  )}

                  {expandedId !== approval.id && isReviewer && (
                    <button
                      type="button"
                      onClick={() => setExpandedId(approval.id)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Review
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {completed.length > 0 && (
        <div>
          <h3 className="mb-3 font-semibold text-gray-900">
            Completed Approvals ({completed.length})
          </h3>
          <div className="space-y-2">
            {completed.map((approval) => (
              <div key={approval.id} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Approval Request</p>
                    <p className="text-xs text-gray-500">
                      {approval.status === 'REJECTED'
                        ? `Rejected — ${approval.rejectionReason || 'No reason provided'}`
                        : approval.status === 'CANCELLED'
                          ? 'Cancelled'
                          : 'Approved'}
                    </p>
                  </div>
                  <span
                    className={`rounded px-2 py-1 text-xs font-medium ${getStatusColor(approval.status)}`}
                  >
                    {approval.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
