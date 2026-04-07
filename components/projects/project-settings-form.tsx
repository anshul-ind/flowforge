'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import {
  updateProjectSettingsAction,
  type UpdateProjectSettingsState,
} from '@/lib/actions/project-settings'

const STATUS_OPTIONS = [
  { value: 'PLANNED', label: 'Planned' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_HOLD', label: 'On hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' },
] as const

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

function dueDateInputValue(d: Date | null): string {
  if (!d) return ''
  const x = new Date(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function ProjectSettingsForm({
  workspaceId,
  projectId,
  initialTitle,
  initialDescription,
  initialStatus,
  initialDueDate,
}: {
  workspaceId: string
  projectId: string
  initialTitle: string
  initialDescription: string | null
  initialStatus: string
  initialDueDate: Date | null
}) {
  const [state, formAction] = useActionState<
    UpdateProjectSettingsState | null,
    FormData
  >(updateProjectSettingsAction, null)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="projectId" value={projectId} />

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
        <label htmlFor="proj-title" className="mb-1 block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          id="proj-title"
          name="title"
          type="text"
          required
          defaultValue={initialTitle}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="proj-desc" className="mb-1 block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="proj-desc"
          name="description"
          rows={4}
          defaultValue={initialDescription ?? ''}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="proj-status" className="mb-1 block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          id="proj-status"
          name="status"
          defaultValue={initialStatus}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="proj-due" className="mb-1 block text-sm font-medium text-gray-700">
          Due date
        </label>
        <input
          id="proj-due"
          name="dueDate"
          type="date"
          defaultValue={dueDateInputValue(initialDueDate)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">Leave empty to clear the due date.</p>
      </div>

      <SubmitButton />
    </form>
  )
}
