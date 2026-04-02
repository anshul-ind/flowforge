'use client';

import { useState, useTransition } from 'react';
import { createApprovalAction } from '@/modules/approval/create-action';
import { WorkspaceMember } from '@/lib/generated/prisma';

interface ApprovalRequestFormProps {
  taskId: string;
  teamMembers: (WorkspaceMember & {
    user: { id: string; name: string | null; email: string };
  })[];
  onSuccess?: () => void;
}

export function ApprovalRequestForm({
  taskId,
  teamMembers,
  onSuccess,
}: ApprovalRequestFormProps) {
  const [reviewerId, setReviewerId] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filter to managers and owners only
  const managers = teamMembers.filter((m) => m.role === 'MANAGER' || m.role === 'OWNER');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reviewerId) {
      setError('Please select a reviewer');
      return;
    }

    startTransition(async () => {
      try {
        const result = await createApprovalAction({
          taskId,
          reviewerId,
          note: note || undefined,
        });

        if (!result.success) {
          setError(result.message || 'Failed to submit approval');
          return;
        }

        setReviewerId('');
        setNote('');
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    });
  };

  if (managers.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
        No managers or owners available to request approval from
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
      <h3 className="font-semibold text-gray-900">Request Approval</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Reviewer</label>
        <select
          value={reviewerId}
          onChange={(e) => setReviewerId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select a reviewer...</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.user.name || m.user.email} ({m.role})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add any details for the reviewer..."
          maxLength={1000}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
        <p className="text-xs text-gray-500 mt-1">{note.length}/1000</p>
      </div>

      {error && <div className="text-sm text-red-600 p-3 bg-red-50 rounded">{error}</div>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!reviewerId || isPending}
          className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Submitting...' : 'Submit for Approval'}
        </button>
      </div>
    </form>
  );
}
