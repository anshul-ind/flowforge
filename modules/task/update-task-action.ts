'use server';

import { z } from 'zod';
import { requireUser } from '@/lib/auth/require-user';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { parseFormData } from '@/lib/validation/parse';
import { successResult, errorResult, ActionResult } from '@/types/action-result';
import { TaskService } from './service';
import { TaskPriority, TaskStatus } from '@/lib/generated/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Update Task Schema
 */
const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(200, 'Task title must be less than 200 characters')
    .optional(),
  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .nullable(),
  priority: z
    .enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const)
    .optional(),
  status: z
    .enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'] as const)
    .optional(),
  assigneeId: z
    .string()
    .optional()
    .nullable(),
  dueDate: z
    .string()
    .optional()
    .nullable(),
  tags: z
    .string()
    .optional()
    .nullable(),
});

export async function updateTaskAction(
  workspaceId: string,
  projectId: string,
  taskId: string,
  formData: FormData
): Promise<ActionResult<{ id: string; title: string }>> {
  try {
    console.log('[Task Action] Updating task:', taskId);

    // 1. Require authentication
    const user = await requireUser();

    // 2. Resolve tenant context
    const tenant = await resolveTenantContext(workspaceId, user.id);
    if (!tenant) {
      return errorResult('Workspace access denied');
    }

    // 3. Parse and validate input
    const parseResult = parseFormData(updateTaskSchema, {
      title: formData.get('title'),
      description: formData.get('description'),
      priority: formData.get('priority'),
      status: formData.get('status'),
      assigneeId: formData.get('assigneeId'),
      dueDate: formData.get('dueDate'),
      tags: formData.get('tags'),
    });

    if (!parseResult.success) {
      return parseResult;
    }

    const validData = parseResult.data!;

    // 4. Update task via service
    const service = new TaskService(tenant);

    let dueDate: Date | undefined;
    if (validData.dueDate) {
      dueDate = new Date(validData.dueDate);
      if (isNaN(dueDate.getTime())) {
        return errorResult('Invalid due date');
      }
    }

    // Parse tags
    const tags = validData.tags?.split(',').filter(t => t.trim());

    const task = await service.updateTask(taskId, {
      title: validData.title,
      description: validData.description ?? undefined,
      priority: validData.priority as TaskPriority | undefined,
      status: validData.status as TaskStatus | undefined,
      assigneeId: validData.assigneeId,
      dueDate,
    });

    console.log('[Task Action] Task updated:', task.id);

    // 5. Revalidate cache
    revalidatePath(`/workspace/${workspaceId}/project/${projectId}`);

    return successResult(
      { id: task.id, title: task.title },
      'Task updated successfully!'
    );
  } catch (error) {
    console.error('[Task Action] Error:', error);
    if (error instanceof Error) {
      return errorResult(error.message);
    }
    return errorResult('Failed to update task. Please try again.');
  }
}
