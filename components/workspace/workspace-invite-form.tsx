'use client'

import { useActionState, useState } from 'react'
import { createWorkspaceInviteAction } from '@/lib/actions/invite-workflow'
import { cn } from '@/lib/utils'

type Mode = 'email' | 'link'

function fieldHint(
  details: { fieldErrors?: Record<string, string[] | undefined> } | undefined
): string | null {
  if (!details?.fieldErrors) return null
  const parts = Object.entries(details.fieldErrors).flatMap(([, v]) => v ?? [])
  return parts.length ? parts.join(' · ') : null
}

export function WorkspaceInviteForm({ workspaceId }: { workspaceId: string }) {
  const [state, formAction, pending] = useActionState(createWorkspaceInviteAction, null)
  const [mode, setMode] = useState<Mode>('email')

  return (
    <form action={formAction} className="max-w-xl space-y-6">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="mode" value={mode} />

      <div className="flex gap-2 rounded-lg border border-gray-200 p-1 bg-gray-50">
        <button
          type="button"
          onClick={() => setMode('email')}
          className={cn(
            'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            mode === 'email'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Email invite
        </button>
        <button
          type="button"
          onClick={() => setMode('link')}
          className={cn(
            'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            mode === 'link'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Share link
        </button>
      </div>

      {mode === 'email' && (
        <div>
          <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="invite-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="colleague@company.com"
            disabled={pending}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
          />
        </div>
      )}

      <div>
        <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700">
          Role
        </label>
        <select
          id="invite-role"
          name="role"
          defaultValue="MEMBER"
          disabled={pending}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
        >
          <option value="VIEWER">Viewer</option>
          <option value="MEMBER">Member</option>
          <option value="MANAGER">Manager</option>
        </select>
      </div>

      {!state?.ok && state?.error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {state.error}
          {state && 'details' in state && fieldHint(state.details) && (
            <p className="mt-1 text-xs">{fieldHint(state.details)}</p>
          )}
        </div>
      )}

      {state?.ok && (
        <div className="space-y-3 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          <p className="font-medium">Invitation ready</p>
          {state.emailSent === true && <p>An email was sent to the recipient.</p>}
          {state.emailError && <p className="text-amber-900">{state.emailError}</p>}
          <div>
            <p className="text-xs font-medium text-green-800 mb-1">Invite link</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="block flex-1 truncate rounded bg-white px-2 py-1 text-xs text-gray-800 border border-green-200">
                {state.inviteUrl}
              </code>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(state.inviteUrl)
                }}
                className="rounded-md bg-green-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-900"
              >
                Copy link
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900 disabled:opacity-50"
      >
        {pending ? 'Creating…' : mode === 'email' ? 'Send invitation' : 'Generate link'}
      </button>
    </form>
  )
}
