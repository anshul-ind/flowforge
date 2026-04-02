'use server';

import { requireUser } from '@/lib/auth/require-user';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { TaskDependencyService } from '@/modules/task/dependency-service';
import { successResult, errorResult } from '@/types/action-result';
import { z } from 'zod';

/**
 * Add task dependency server action
 * Creates a dependency relationship between two tasks
 */
export async function addTaskDependency(
  workspaceId: string,
  taskId: string,
  dependsOnTaskId: string
) {
  try {
    const user = await requireUser();
    const tenant = await resolveTenantContext(workspaceId, user.id);

    if (!tenant) {
      return errorResult('Workspace not found or access denied');
    }

    // Validate inputs
    if (!taskId || !dependsOnTaskId) {
      return errorResult('Task IDs are required');
    }

    if (taskId === dependsOnTaskId) {
      return errorResult('A task cannot depend on itself');
    }

    const service = new TaskDependencyService(tenant);
    const dependency = await service.addDependency(taskId, dependsOnTaskId);

    return successResult(
      {
        id: dependency.id,
        taskId: dependency.taskId,
        dependsOnTaskId: dependency.dependsOnTaskId,
      },
      'Dependency added successfully'
    );
  } catch (error: any) {
    return errorResult(
      error?.message || 'Failed to add dependency'
    );
  }
}

/**
 * Remove task dependency server action
 */
export async function removeTaskDependency(
  workspaceId: string,
  dependencyId: string
) {
  try {
    const user = await requireUser();
    const tenant = await resolveTenantContext(workspaceId, user.id);

    if (!tenant) {
      return errorResult('Workspace not found or access denied');
    }

    if (!dependencyId) {
      return errorResult('Dependency ID is required');
    }

    const service = new TaskDependencyService(tenant);
    await service.removeDependency(dependencyId);

    return successResult(null, 'Dependency removed successfully');
  } catch (error: any) {
    return errorResult(
      error?.message || 'Failed to remove dependency'
    );
  }
}

/**
 * Get task dependencies server action
 */
export async function getTaskDependencies(
  workspaceId: string,
  taskId: string
) {
  try {
    const user = await requireUser();
    const tenant = await resolveTenantContext(workspaceId, user.id);

    if (!tenant) {
      return errorResult('Workspace not found or access denied');
    }

    const service = new TaskDependencyService(tenant);
    const dependencies = await service.getTaskDependencies(taskId);

    return successResult(dependencies, 'Dependencies retrieved');
  } catch (error: any) {
    return errorResult(
      error?.message || 'Failed to get dependencies'
    );
  }
}

/**
 * Get task dependents server action
 */
export async function getTaskDependents(workspaceId: string, taskId: string) {
  try {
    const user = await requireUser();
    const tenant = await resolveTenantContext(workspaceId, user.id);

    if (!tenant) {
      return errorResult('Workspace not found or access denied');
    }

    const service = new TaskDependencyService(tenant);
    const dependents = await service.getTaskDependents(taskId);

    return successResult(dependents, 'Dependents retrieved');
  } catch (error: any) {
    return errorResult(
      error?.message || 'Failed to get dependents'
    );
  }
}
