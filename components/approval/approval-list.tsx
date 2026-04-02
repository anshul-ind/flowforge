'use client';

import { ApprovalRequest } from '@/lib/generated/prisma';
import { useState, useEffect } from 'react';
import { ApprovalDecisionForm } from './approval-decision-form';
import { ApprovalRepository } from '@/modules/approval/repository';
import { TenantContext } from '@/lib/tenant/tenant-context';

interface ApprovalsListProps {
  tenant: TenantContext;
  currentUserId: string;
}

export function ApprovalsList({ tenant, currentUserId }: ApprovalsListProps) {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      setError(null);
      const repo = new ApprovalRepository(tenant);
      const loaded = await repo.listApprovals();
      setApprovals(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load approvals');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-gray-500">Loading approvals...</div>;
  }

  const pending = approvals.filter((a) => a.status === 'PENDING');
  const completed = approvals.filter((a) => a.status !== 'PENDING');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {error && <div className="text-red-600 text-sm p-3 bg-red-50 rounded">{error}</div>}

      {/* Pending Approvals */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">
          Pending Approvals ({pending.length})
        </h3>
        <div className="space-y-2">
          {pending.length === 0 ? (
            <p className="text-sm text-gray-500">No pending approvals</p>
          ) : (
            pending.map((approval) => {
              const isReviewer = approval.approverId === currentUserId;
              return (
                <div key={approval.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium text-gray-900">{approval.title}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(approval.status)}`}>
                      {approval.status}
                    </span>
                  </div>

                  {expandedId === approval.id && (
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-sm text-gray-700 mb-3">{approval.notes || 'No notes'}</p>
                      {isReviewer ? (
                        <div className="flex gap-2">
                          <button className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                            Approve
                          </button>
                          <button className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700">
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
                      onClick={() => setExpandedId(approval.id)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Review
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Completed Approvals */}
      {completed.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">
            Completed Approvals ({completed.length})
          </h3>
          <div className="space-y-2">
            {completed.map((approval) => (
              <div key={approval.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{approval.title}</p>
                    <p className="text-xs text-gray-500">
                      {approval.status === 'REJECTED'
                        ? `Rejected - Reason: ${approval.notes || 'No reason provided'}`
                        : approval.status === 'CANCELLED'
                          ? 'Cancelled'
                          : 'Approved'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(approval.status)}`}>
                    {approval.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
