'use client';

import { useState } from 'react';
import { inviteMemberAction } from '@/modules/workspace/invite-action';
import { ActionResult } from '@/types/action-result';
import { WorkspaceMember, WorkspaceRole } from '@/lib/generated/prisma';

/**
 * Invite Member Form
 * 
 * Client component for inviting members to a workspace.
 * 
 * Features:
 * - Email input validation
 * - Role selection dropdown (VIEWER, MEMBER, MANAGER, OWNER)
 * - Loading state during submission
 * - Field-level error messages
 * - Success callback
 * 
 * Props:
 * - onSuccess: Callback when member invited successfully
 * 
 * Usage:
 * <InviteMemberForm onSuccess={() => refetch()} />
 */
interface InviteMemberFormProps {
  workspaceId: string;
  onSuccess?: (member: WorkspaceMember) => void;
}

const ROLES: WorkspaceRole[] = ['VIEWER', 'MEMBER', 'MANAGER', 'OWNER'];

export function InviteMemberForm({ workspaceId, onSuccess }: InviteMemberFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(formData: FormData) {
    try {
      setIsLoading(true);
      setError(null);
      setFieldErrors({});

      const input = {
        email: formData.get('email'),
        role: formData.get('role') || 'MEMBER',
      };

      const result: ActionResult<WorkspaceMember> = await inviteMemberAction(workspaceId, input);

      if (!result.success) {
        setError(result.message || 'Failed to invite member');
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      // Success - call callback
      onSuccess?.(result.data as WorkspaceMember);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="member@example.com"
            required
            disabled={isLoading}
            className={`mt-1 block w-full rounded-md border ${
              fieldErrors.email ? 'border-red-500' : 'border-gray-300'
            } px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100`}
          />
          {fieldErrors.email && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.email[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            Role
          </label>
          <select
            id="role"
            name="role"
            defaultValue="MEMBER"
            disabled={isLoading}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          {fieldErrors.role && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.role[0]}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isLoading ? 'Inviting...' : 'Invite Member'}
      </button>
    </form>
  );
}
