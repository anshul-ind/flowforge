'use server';

import { auth } from '@/auth';
import { getWorkspaceContext } from '@/lib/tenancy/workspace-context';
import { requirePermission } from '@/lib/permissions/rbac';
import { revalidatePath } from 'next/cache';

interface CreateTaskInput {
  workspaceId: string;
  projectId: string;
  title: string;
  description?: string;
  assigneeId?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
}

interface UpdateTaskStatusInput {
  workspaceId: string;
  taskId: string;
  status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';
}

interface AssignTaskInput {
  workspaceId: string;
  taskId: string;
  assigneeId: string;
}

/**
 * Create a new task in a project
 * Requires: create_task permission
 */
export async function createTaskAction(
  input: CreateTaskInput
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const context = await getWorkspaceContext(session, input.workspaceId);
    if (!context) {
      return {
        success: false,
        error: 'Access denied',
      };
    }

    requirePermission(context.role, 'create_task');

    // TODO: Validate project belongs to workspace
    // TODO: Create task in DB
    // TODO: Notify assignee
    // TODO: Audit log

    revalidatePath(`/workspace/${input.workspaceId}/project/${input.projectId}`);

    return {
      success: true,
      message: 'Task created',
    };
  } catch (error) {
    console.error('[createTaskAction]', error);
    return {
      success: false,
      error: String(error).includes('Insufficient') ? String(error) : 'Failed to create task',
    };
  }
}

/**
 * Update task status (e.g., drag-drop on kanban)
 * Requires: update_task_status permission
 * Optimistic: client updates immediately, server confirms
 */
export async function updateTaskStatusAction(
  input: UpdateTaskStatusInput
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const context = await getWorkspaceContext(session, input.workspaceId);
    if (!context) {
      return {
        success: false,
        error: 'Access denied',
      };
    }

    requirePermission(context.role, 'update_task_status');

    // TODO: Update task status in DB
    // TODO: Audit log
    // TODO: Trigger notifications if status changed to IN_REVIEW or DONE

    revalidatePath(`/workspace/${input.workspaceId}`);

    return {
      success: true,
      message: 'Task status updated',
    };
  } catch (error) {
    console.error('[updateTaskStatusAction]', error);
    return {
      success: false,
      error: String(error).includes('Insufficient') ? String(error) : 'Failed to update task',
    };
  }
}

/**
 * Assign task to a user
 * Requires: assign_task permission
 */
export async function assignTaskAction(
  input: AssignTaskInput
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const context = await getWorkspaceContext(session, input.workspaceId);
    if (!context) {
      return {
        success: false,
        error: 'Access denied',
      };
    }

    requirePermission(context.role, 'assign_task');

    // TODO: Validate assignee is workspace member
    // TODO: Update task assignment in DB
    // TODO: Notify assignee
    // TODO: Audit log

    revalidatePath(`/workspace/${input.workspaceId}`);

    return {
      success: true,
      message: 'Task assigned',
    };
  } catch (error) {
    console.error('[assignTaskAction]', error);
    return {
      success: false,
      error: String(error).includes('Insufficient') ? String(error) : 'Failed to assign task',
    };
  }
}
