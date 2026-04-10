'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { JoinInviteState } from '@/app/invite/[token]/actions'
import { joinWorkspaceFromInviteAction } from '@/app/invite/[token]/actions'
import { cn } from '@/lib/utils'

export function InviteAcceptForm({ token }: { token: string }) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState<
    JoinInviteState,
    FormData
  >(joinWorkspaceFromInviteAction, null)
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    if (state?.ok === true) {
      handled.current = true
      router.push(state.nextPath)
      router.refresh()
    }
  }, [state, router])

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {state?.ok === false && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className={cn(
          'w-full rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white',
          'hover:bg-gray-900 disabled:opacity-50'
        )}
      >
        {pending ? 'Joining…' : 'Join now'}
      </button>
    </form>
  )
}
