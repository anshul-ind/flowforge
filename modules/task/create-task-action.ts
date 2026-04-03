'use server';

import { z } from 'zod';
import { requireUser } from '@/lib/auth/require-user';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { parseFormData } from '@/lib/validation/parse';
import { successResult, errorResult, ActionResult } from '@/types/action-result';
import { TaskService } from './service';
import { TaskPriority } from '@/lib/generated/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Create Task Schema
 */
const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(200, 'Task title must be less than 200 characters'),
  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .nullable(),
  priority: z
    .enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const)
    .default('MEDIUM'),
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

export async function createTaskAction(
  workspaceId: string,
  projectId: string,
  formData: FormData
): Promise<ActionResult<{ id: string; title: string }>> {
  try {
    console.log('[Task Action] Creating task for project:', projectId);

    // 1. Require authentication
    const user = await requireUser();
    console.log('[Task Action] User authenticated:', user.id);

    // 2. Resolve tenant context
    const tenant = await resolveTenantContext(workspaceId, user.id);
    if (!tenant) {
      return errorResult('Workspace access denied');
    }

    // 3. Parse and validate input
    const parseResult = parseFormData(createTaskSchema, {
      title: formData.get('title'),
      description: formData.get('description'),
      priority: formData.get('priority'),
      assigneeId: formData.get('assigneeId'),
      dueDate: formData.get('dueDate'),
      tags: formData.get('tags'),
    });

    if (!parseResult.success) {
      console.error('[Task Action] Validation errors:', parseResult.fieldErrors);
      return parseResult;
    }

    const validData = parseResult.data!;

    // 4. Create task via service
    const service = new TaskService(tenant);

    let dueDate: Date | undefined;
    if (validData.dueDate) {
      dueDate = new Date(validData.dueDate);
      if (isNaN(dueDate.getTime())) {
        return errorResult('Invalid due date');
      }
    }

    const task = await service.createTask({
      projectId,
      title: validData.title,
      description: validData.description || undefined,
      priority: (validData.priority || 'MEDIUM') as TaskPriority,
      assigneeId: validData.assigneeId || undefined,
      dueDate,
    });

    console.log('[Task Action] Task created:', task.id);

    // 5. Revalidate cache
    revalidatePath(`/workspace/${workspaceId}/projects/${projectId}`);

    return successResult(
      { id: task.id, title: task.title },
      'Task created successfully!'
    );
  } catch (error) {
    console.error('[Task Action] Error:', error);
    if (error instanceof Error) {
      return errorResult(error.message);
    }
    return errorResult('Failed to create task. Please try again.');
  }
}
