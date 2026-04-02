import { TenantContext } from '@/lib/tenant/tenant-context';
import { prisma } from '@/lib/db';
import { TaskDependency } from '@/lib/generated/prisma';

/**
 * Task Dependency Repository
 *
 * Data access layer for task dependencies.
 * Enforces workspace scoping and prevents circular dependencies.
 */
export class TaskDependencyRepository {
  constructor(private tenant: TenantContext) {}

  /**
   * Get all dependencies for a task (tasks that block this task)
   */
  async getTaskDependencies(taskId: string): Promise<TaskDependency[]> {
    // Verify task exists in workspace
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        workspaceId: this.tenant.workspaceId,
      },
    });

    if (!task) return [];

    return await prisma.taskDependency.findMany({
      where: {
        taskId: taskId,
      },
    });
  }

  /**
   * Get all dependents for a task (tasks blocked by this task)
   */
  async getTaskDependents(taskId: string): Promise<TaskDependency[]> {
    // Verify task exists in workspace
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        workspaceId: this.tenant.workspaceId,
      },
    });

    if (!task) return [];

    return await prisma.taskDependency.findMany({
      where: {
        dependsOnTaskId: taskId,
      },
    });
  }

  /**
   * Add a dependency (task A depends on task B)
   */
  async addDependency(
    taskId: string,
    dependsOnTaskId: string
  ): Promise<TaskDependency | null> {
    // Verify both tasks exist in workspace
    const [task, dependsOnTask] = await Promise.all([
      prisma.task.findFirst({
        where: {
          id: taskId,
          workspaceId: this.tenant.workspaceId,
        },
      }),
      prisma.task.findFirst({
        where: {
          id: dependsOnTaskId,
          workspaceId: this.tenant.workspaceId,
        },
      }),
    ]);

    if (!task || !dependsOnTask) return null;

    // Prevent self-dependency
    if (taskId === dependsOnTaskId) return null;

    // Check for existing dependency
    const existing = await prisma.taskDependency.findUnique({
      where: {
        taskId_dependsOnTaskId: {
          taskId,
          dependsOnTaskId,
        },
      },
    });

    if (existing) return existing;

    return await prisma.taskDependency.create({
      data: {
        taskId,
        dependsOnTaskId,
      },
    });
  }

  /**
   * Remove a dependency
   */
  async removeDependency(dependencyId: string): Promise<TaskDependency | null> {
    const dependency = await prisma.taskDependency.findUnique({
      where: { id: dependencyId },
    });

    if (!dependency) return null;

    // Verify task belongs to workspace
    const task = await prisma.task.findFirst({
      where: {
        id: dependency.taskId,
        workspaceId: this.tenant.workspaceId,
      },
    });

    if (!task) return null;

    return await prisma.taskDependency.delete({
      where: { id: dependencyId },
    });
  }

  /**
   * Check for circular dependencies (recursive DFS)
   * Returns true if adding this dependency would create a cycle
   */
  async hasCircularDependency(
    taskId: string,
    dependsOnTaskId: string
  ): Promise<boolean> {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = async (currentTaskId: string): Promise<boolean> => {
      visited.add(currentTaskId);
      recursionStack.add(currentTaskId);

      // Get all tasks that depend on the current task
      const dependents = await prisma.taskDependency.findMany({
        where: {
          dependsOnTaskId: currentTaskId,
        },
      });

      for (const dep of dependents) {
        // If we found the task we're trying to add as dependency, it's a cycle
        if (dep.taskId === taskId) {
          return true;
        }

        if (!visited.has(dep.taskId)) {
          if (await hasCycle(dep.taskId)) {
            return true;
          }
        } else if (recursionStack.has(dep.taskId)) {
          return true;
        }
      }

      recursionStack.delete(currentTaskId);
      return false;
    };

    return await hasCycle(dependsOnTaskId);
  }
}
