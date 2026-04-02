'use client';

import { useState } from 'react';
import { WorkspaceMember } from '@/lib/generated/prisma';
import { updateMemberRoleAction } from '@/modules/workspace/update-member-action';
import { removeMemberAction } from '@/modules/workspace/remove-member-action';
import { ActionResult } from '@/types/action-result';

/**
 * Member List Component
 * 
 * Displays workspace members with role management and removal options.
 * 
 * Features:
 * - List all members with their roles
 * - Role dropdown to change member role
 * - Remove member button with confirmation
 * - Loading states during actions
 * - Error handling
 * 
 * Props:
 * - members: Array of workspace members
 * - currentUserRole: Current user's role (for permission checks)
 * - onMemberUpdated: Callback when member role changed
 * - onMemberRemoved: Callback when member removed
 * 
 * Usage:
 * <MemberList members={members} currentUserRole={userRole} />
 */

interface MemberListProps {
  workspaceId: string;
  members: (WorkspaceMember & { user: { name: string | null; email: string } })[];
  currentUserRole: string;
  onMemberUpdated?: (member: WorkspaceMember) => void;
  onMemberRemoved?: (memberId: string) => void;
}

/**
 * Role badge styling map
 */
const ROLE_STYLES: Record<string, { bg: string; text: string }> = {
  OWNER: { bg: 'bg-purple-100', text: 'text-purple-700' },
  MANAGER: { bg: 'bg-blue-100', text: 'text-blue-700' },
  MEMBER: { bg: 'bg-gray-100', text: 'text-gray-700' },
  VIEWER: { bg: 'bg-orange-100', text: 'text-orange-700' },
};

export function MemberList({
  workspaceId,
  members,
  currentUserRole,
  onMemberUpdated,
  onMemberRemoved,
}: MemberListProps) {
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canManage = currentUserRole === 'OWNER' || currentUserRole === 'MANAGER';

  async function handleRoleChange(memberId: string, newRole: string) {
    try {
      setLoadingMemberId(memberId);
      setError(null);

      const result: ActionResult<WorkspaceMember> = await updateMemberRoleAction(workspaceId, {
        memberId,
        role: newRole,
      });

      if (!result.success) {
        setError(result.message || 'Failed to update role');
        return;
      }

      onMemberUpdated?.(result.data as WorkspaceMember);
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    } finally {
      setLoadingMemberId(null);
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      setLoadingMemberId(memberId);
      setError(null);

      const result: ActionResult<null> = await removeMemberAction(workspaceId, { memberId });

      if (!result.success) {
        setError(result.message || 'Failed to remove member');
        return;
      }

      onMemberRemoved?.(memberId);
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    } finally {
      setLoadingMemberId(null);
    }
  }

  if (!members || members.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <p>No members yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {members.map((member) => {
          const roleStyle = ROLE_STYLES[member.role];

          return (
            <div
              key={member.id}
              className="p-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 bg-linear-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {member.user.name?.charAt(0)?.toUpperCase() ||
                    member.user.email.charAt(0).toUpperCase()}
                </div>

                {/* User info */}
                <div>
                  <p className="font-medium text-gray-900">
                    {member.user.name || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-500">{member.user.email}</p>
                </div>
              </div>

              {/* Role and actions */}
              <div className="flex items-center gap-4">
                {canManage ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    disabled={loadingMemberId === member.id}
                    className={`rounded-md border ${roleStyle.bg} px-3 py-1 text-sm font-semibold ${roleStyle.text} disabled:bg-gray-100`}
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="MEMBER">Member</option>
                    <option value="MANAGER">Manager</option>
                    <option value="OWNER">Owner</option>
                  </select>
                ) : (
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${roleStyle.bg} ${roleStyle.text}`}
                  >
                    {member.role}
                  </span>
                )}

                {canManage && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={loadingMemberId === member.id}
                    className="text-sm text-red-600 hover:text-red-700 disabled:text-gray-400"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
