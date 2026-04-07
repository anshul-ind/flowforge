'use server'

import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant'
import { WorkspaceService } from '@/modules/workspace/service'
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors'

export type UpdateWorkspaceSettingsState = { ok: true } | { ok: false; error: string }

export async function updateWorkspaceSettingsAction(
  _prev: UpdateWorkspaceSettingsState | null,
  formData: FormData
): Promise<UpdateWorkspaceSettingsState> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'You must be signed in' }
  }

  const workspaceId = String(formData.get('workspaceId') ?? '').trim()
  const nameRaw = formData.get('name')
  const slugRaw = formData.get('slug')
  if (!workspaceId) {
    return { ok: false, error: 'Missing workspace' }
  }

  const name = typeof nameRaw === 'string' ? nameRaw.trim() : ''
  const slug =
    typeof slugRaw === 'string'
      ? slugRaw
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
      : ''

  if (!name && !slug) {
    return { ok: false, error: 'Enter a workspace name or URL slug to save' }
  }

  const tenant = await resolveTenantContext(workspaceId, session.user.id)
  if (!tenant) {
    return { ok: false, error: 'Access denied' }
  }

  try {
    const service = new WorkspaceService(tenant)
    await service.updateWorkspace({
      ...(name ? { name } : {}),
      ...(slug ? { slug } : {}),
    })
    revalidatePath(`/workspace/${workspaceId}`)
    revalidatePath(`/workspace/${workspaceId}/settings`)
    return { ok: true }
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: e.message }
    if (e instanceof ValidationError) return { ok: false, error: e.message }
    if (e instanceof NotFoundError) return { ok: false, error: e.message }
    console.error('[updateWorkspaceSettingsAction]', e)
    return { ok: false, error: 'Failed to update workspace' }
  }
}
