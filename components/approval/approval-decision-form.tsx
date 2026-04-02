'use client';

import { ApprovalRequest } from '@/lib/generated/prisma';
import { approveApprovalAction, rejectApprovalAction } from '@/modules/approval/respond-action';
import { useState, useTransition } from 'react';

interface ApprovalDecisionFormProps {
  approval: ApprovalRequest & {
    task: { id: string; title: string };
    requester: { id: string; name: string | null; email: string };
    approver: { id: string; name: string | null; email: string };
  };
  isReviewer: boolean;
  onSuccess?: () => void;
}

export function ApprovalDecisionForm({
  approval,
  isReviewer,
  onSuccess,
}: ApprovalDecisionFormProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleApprove = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await approveApprovalAction({
          approvalId: approval.id,
        });

        if (!result.success) {
          setError(result.message || 'Failed to approve');
          return;
        }

        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    });
  };

  const handleReject = () => {
    if (rejectionReason.length < 10) {
      setError('Reason must be at least 10 characters');
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const result = await rejectApprovalAction({
          approvalId: approval.id,
          reason: rejectionReason,
        });

        if (!result.success) {
          setError(result.message || 'Failed to reject');
          return;
        }

        setRejectionReason('');
        setShowRejectForm(false);
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    });
  };

  if (showRejectForm) {
    return (
      <div className="space-y-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <h4 className="font-semibold text-red-900">Reject Approval Request</h4>
        <textarea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Explain why this is rejected (min 10 characters)..."
          maxLength={1000}
          className="w-full px-3 py-2 border border-red-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          rows={3}
        />
        <p className="text-xs text-red-700">{rejectionReason.length}/1000 characters</p>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="flex gap-2">
          <button
            onClick={handleReject}
            disabled={rejectionReason.length < 10 || isPending}
            className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Rejecting...' : 'Confirm Rejection'}
          </button>
          <button
            onClick={() => {
              setShowRejectForm(false);
              setRejectionReason('');
              setError(null);
            }}
            className="flex-1 px-3 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="text-sm">
        <p className="font-medium text-gray-900">{approval.task.title}</p>
        <p className="text-gray-600">
          Requested by: {approval.requester.name || approval.requester.email}
        </p>
        {approval.notes && <p className="text-gray-600 mt-2">{approval.notes}</p>}
      </div>

      {error && <div className="text-sm text-red-600 p-3 bg-red-50 rounded">{error}</div>}

      {isReviewer ? (
        <div className="flex gap-2">
          <button
            onClick={handleApprove}
            disabled={isPending}
            className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Processing...' : 'Approve'}
          </button>
          <button
            onClick={() => setShowRejectForm(true)}
            disabled={isPending}
            className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Processing...' : 'Reject'}
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-600">Awaiting review from {approval.approver.name || approval.approver.email}</p>
      )}
    </div>
  );
}
