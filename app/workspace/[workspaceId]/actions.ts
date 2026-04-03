'use server'

import { requireUser } from '@/lib/auth/require-user'
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant'
import { ProjectService } from '@/modules/project/service'
import { TaskService } from '@/modules/task/service'
import { revalidatePath } from 'next/cache'

import {
  createTaskAction as createTaskActionImpl,
  submitTaskForApprovalAction as submitTaskForApprovalActionImpl,
  reviewApprovalAction as reviewApprovalActionImpl,
} from './projects/[projectId]/actions'

// Re-export as async wrappers so Next.js treats this file as a valid
// server-action module (no re-export-only named exports).
export async function createTaskAction(
  prev: unknown,
  formData: FormData
) {
  return await createTaskActionImpl(prev, formData)
}

export async function submitTaskForApprovalAction(
  prev: unknown,
  formData: FormData
) {
  return await submitTaskForApprovalActionImpl(prev, formData)
}

export async function reviewApprovalAction(prev: unknown, formData: FormData) {
  return await reviewApprovalActionImpl(prev, formData)
}

/**
 * Server Actions for workspace/project/task management
 * Using React 19 + Next.js patterns
 */

export async function createProjectAction(
  workspaceId: string,
  formData: FormData
) {
  try {
    const user = await requireUser()
    const tenant = await resolveTenantContext(workspaceId, user.id)

    if (!tenant) {
      return { error: 'Workspace access denied' }
    }

    const titleRaw = formData.get('title') ?? formData.get('name')
    const title = typeof titleRaw === 'string' ? titleRaw : ''
    const description = formData.get('description') as string

    if (!title.trim()) {
      return { error: 'Project title is required' }
    }

    const service = new ProjectService(tenant)
    const project = await service.createProject({
      title: title.trim(),
      description: description?.trim() || '',
    })

    revalidatePath(`/workspace/${workspaceId}/projects`)
    revalidatePath(`/workspace/${workspaceId}`)

    return { 
      success: true, 
      projectId: project.id,
      message: 'Project created successfully'
    }
  } catch (error) {
    console.error('Failed to create project:', error)
    return { error: 'Failed to create project' }
  }
}

export async function assignTaskAction(
  workspaceId: string,
  taskId: string,
  assigneeId: string
) {
  try {
    const user = await requireUser()
    const tenant = await resolveTenantContext(workspaceId, user.id)

    if (!tenant) {
      return { error: 'Workspace access denied' }
    }

    const service = new TaskService(tenant)
    await service.assignTask(taskId, assigneeId)

    revalidatePath(`/workspace/${workspaceId}`)

    return {
      success: true,
      message: 'Task assigned successfully',
    }
  } catch (error) {
    console.error('Failed to assign task:', error)
    return { error: 'Failed to assign task' }
  }
}

