'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  addCommentAction,
  type AddCommentState,
} from '@/lib/actions/add-comment'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
    >
      {pending ? 'Posting…' : 'Post comment'}
    </button>
  )
}

export function CommentForm({
  workspaceId,
  taskId,
}: {
  workspaceId: string
  taskId: string
}) {
  const router = useRouter()
  const [formKey, setFormKey] = useState(0)
  const [state, formAction] = useActionState<AddCommentState, FormData>(
    addCommentAction,
    null
  )

  useEffect(() => {
    if (state?.ok === true) {
      setFormKey((k) => k + 1)
      router.refresh()
    }
  }, [state, router])

  return (
    <form key={formKey} action={formAction} className="space-y-3">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="taskId" value={taskId} />
      <textarea
        name="body"
        required
        minLength={1}
        maxLength={2000}
        rows={4}
        placeholder="Write a comment — mention teammates with @name or @emailprefix"
        className="min-h-28 w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
      />
      {state?.ok === false && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state?.ok === false && state.fieldErrors?.body?.[0] && (
        <p className="text-sm text-red-600">{state.fieldErrors.body[0]}</p>
      )}
      <SubmitButton />
    </form>
  )
}
