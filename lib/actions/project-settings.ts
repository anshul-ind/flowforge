'use server'

import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant'
import { ProjectService } from '@/modules/project/service'
import { updateProjectSchema } from '@/modules/project/schemas'
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors'
import type { ProjectStatus } from '@/lib/generated/prisma'

export type UpdateProjectSettingsState = { ok: true } | { ok: false; error: string }

export async function updateProjectSettingsAction(
  _prev: UpdateProjectSettingsState | null,
  formData: FormData
): Promise<UpdateProjectSettingsState> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'You must be signed in' }
  }

  const workspaceId = String(formData.get('workspaceId') ?? '').trim()
  const projectId = String(formData.get('projectId') ?? '').trim()
  if (!workspaceId || !projectId) {
    return { ok: false, error: 'Missing workspace or project' }
  }

  const dueRaw = formData.get('dueDate')
  const statusRaw = formData.get('status')
  const descRaw = formData.get('description')
  const parsed = updateProjectSchema.safeParse({
    title: formData.get('title') ?? undefined,
    description:
      typeof descRaw === 'string'
        ? descRaw.trim() === ''
          ? null
          : descRaw
        : null,
    dueDate: dueRaw && String(dueRaw).trim() !== '' ? String(dueRaw) : null,
    status:
      typeof statusRaw === 'string' && statusRaw.trim() !== ''
        ? statusRaw
        : undefined,
  })

  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
    const first = Object.values(msg).flat()[0]
    return { ok: false, error: first || 'Invalid input' }
  }

  const tenant = await resolveTenantContext(workspaceId, session.user.id)
  if (!tenant) {
    return { ok: false, error: 'Access denied' }
  }

  try {
    const service = new ProjectService(tenant)
    const { title, description, status, dueDate } = parsed.data
    const patch: {
      title?: string
      description?: string | null
      status?: ProjectStatus
      dueDate?: Date | null
    } = {}
    if (title !== undefined) patch.title = title
    if (description !== undefined) patch.description = description
    if (status !== undefined) patch.status = status
    if (dueDate === null) patch.dueDate = null
    else if (dueDate) patch.dueDate = new Date(dueDate)

    await service.updateProject(projectId, patch)

    revalidatePath(`/workspace/${workspaceId}/projects/${projectId}`)
    revalidatePath(`/workspace/${workspaceId}/projects/${projectId}/settings`)
    revalidatePath(`/workspace/${workspaceId}/projects`)
    return { ok: true }
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: e.message }
    if (e instanceof ValidationError) return { ok: false, error: e.message }
    if (e instanceof NotFoundError) return { ok: false, error: e.message }
    console.error('[updateProjectSettingsAction]', e)
    return { ok: false, error: 'Failed to update project' }
  }
}
