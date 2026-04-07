'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import {
  updateWorkspaceSettingsAction,
  type UpdateWorkspaceSettingsState,
} from '@/lib/actions/workspace-settings'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900 disabled:opacity-50"
    >
      {pending ? 'Saving…' : 'Save changes'}
    </button>
  )
}

export function WorkspaceSettingsForm({
  workspaceId,
  initialName,
  initialSlug,
}: {
  workspaceId: string
  initialName: string
  initialSlug: string
}) {
  const [state, formAction] = useActionState<
    UpdateWorkspaceSettingsState | null,
    FormData
  >(updateWorkspaceSettingsAction, null)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      {state?.ok === false ? (
        <div className="rounded-lg border break-words border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </div>
      ) : null}
      {state?.ok === true ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Settings saved.
        </div>
      ) : null}

      <div>
        <label htmlFor="ws-name" className="mb-1 block text-sm font-medium text-gray-700">
          Workspace name
        </label>
        <input
          id="ws-name"
          name="name"
          type="text"
          required
          defaultValue={initialName}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="ws-slug" className="mb-1 block text-sm font-medium text-gray-700">
          URL slug
        </label>
        <input
          id="ws-slug"
          name="slug"
          type="text"
          required
          defaultValue={initialSlug}
          pattern="[a-z0-9-]+"
          title="Lowercase letters, numbers, and hyphens only"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">Used in workspace URLs. Lowercase, no spaces.</p>
      </div>

      <SubmitButton />
    </form>
  )
}
