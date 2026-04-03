'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  markNotificationReadFormAction,
  type MarkNotificationReadState,
} from '@/lib/actions/mark-notification-read'
import { useFormStatus } from 'react-dom'

function MarkReadButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 rounded-md border border-indigo-200 bg-white px-2 py-1 text-xs font-medium text-indigo-800 hover:bg-indigo-50 disabled:opacity-50"
    >
      {pending ? '…' : 'Mark read'}
    </button>
  )
}

export function MarkNotificationReadControl({
  notificationId,
  workspaceId,
}: {
  notificationId: string
  workspaceId: string
}) {
  const router = useRouter()
  const [state, formAction] = useActionState<
    MarkNotificationReadState,
    FormData
  >(markNotificationReadFormAction, null)

  useEffect(() => {
    if (state?.ok === true) {
      router.refresh()
    }
  }, [state, router])

  return (
    <form action={formAction}>
      <input type="hidden" name="notificationId" value={notificationId} />
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <MarkReadButton />
    </form>
  )
}
