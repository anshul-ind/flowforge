'use server'

import { acceptInviteByToken } from '@/lib/actions/invite-workflow'

export type JoinInviteState =
  | null
  | { ok: false; error: string }
  | { ok: true; workspaceId: string; nextPath: string }

export async function joinWorkspaceFromInviteAction(
  _prev: JoinInviteState,
  formData: FormData
): Promise<JoinInviteState> {
  const token = formData.get('token')
  if (typeof token !== 'string' || !token.trim()) {
    return { ok: false, error: 'Missing invitation token' }
  }

  const result = await acceptInviteByToken(token.trim())
  if (!result.ok) {
    return { ok: false, error: result.error }
  }

  return { ok: true, workspaceId: result.workspaceId, nextPath: result.nextPath }
}
