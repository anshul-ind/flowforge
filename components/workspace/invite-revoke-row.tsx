'use client'

import { useActionState } from 'react'
import {
  revokeWorkspaceInviteAction,
  type RevokeInviteState,
} from '@/lib/actions/invite-workflow'
import { formatDistanceToNow } from 'date-fns'

export type InviteRowModel = {
  id: string
  email: string
  workspaceRole: string | null
  expiresAt: Date
  createdAt: Date
  projectTitle: string | null
  taskTitle: string | null
}

export function InviteRevokeRow({
  workspaceId,
  invite,
}: {
  workspaceId: string
  invite: InviteRowModel
}) {
  const [state, formAction, pending] = useActionState(
    revokeWorkspaceInviteAction,
    null as RevokeInviteState | null
  )

  const scope =
    invite.taskTitle != null
      ? `Task: ${invite.taskTitle}`
      : invite.projectTitle != null
        ? `Project: ${invite.projectTitle}`
        : 'Workspace'

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-4 py-3 text-sm text-gray-900">{invite.email || '(link only)'}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{scope}</td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {invite.workspaceRole?.replaceAll('_', ' ') ?? '—'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {formatDistanceToNow(invite.expiresAt, { addSuffix: true })}
      </td>
      <td className="px-4 py-3 text-right">
        <form action={formAction} className="inline-flex flex-col items-end gap-1">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <input type="hidden" name="inviteId" value={invite.id} />
          <button
            type="submit"
            disabled={pending}
            className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {pending ? 'Revoking…' : 'Revoke'}
          </button>
          {state?.ok === false ? (
            <span className="text-xs text-red-600">{state.error}</span>
          ) : null}
        </form>
      </td>
    </tr>
  )
}
