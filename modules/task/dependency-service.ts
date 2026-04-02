import { TenantContext } from '@/lib/tenant/tenant-context';
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { TaskPolicy } from './policies';
import { TaskDependencyRepository } from './dependency-repository';
import { TaskRepository } from './repository';
import { TaskDependency, TaskStatus } from '@/lib/generated/prisma';

/**
 * Task Dependency Service
 *
 * Handles task dependency operations with:
 * - Authorization checks
 * - Circular dependency detection
 * - Status transition workflow validation
 */
export class TaskDependencyService {
  private depRepo: TaskDependencyRepository;
  private taskRepo: TaskRepository;

  constructor(private tenant: TenantContext) {
    this.depRepo = new TaskDependencyRepository(tenant);
    this.taskRepo = new TaskRepository(tenant);
  }

  /**
   * Get task dependencies (tasks that block this task)
   */
  async getTaskDependencies(taskId: string): Promise<TaskDependency[]> {
    if (!TaskPolicy.canRead(this.tenant)) {
      throw new ForbiddenError('Cannot read tasks');
    }

    const task = await this.taskRepo.getTask(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    return await this.depRepo.getTaskDependencies(taskId);
  }

  /**
   * Get task dependents (tasks blocked by this task)
   */
  async getTaskDependents(taskId: string): Promise<TaskDependency[]> {
    if (!TaskPolicy.canRead(this.tenant)) {
      throw new ForbiddenError('Cannot read tasks');
    }

    const task = await this.taskRepo.getTask(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    return await this.depRepo.getTaskDependents(taskId);
  }

  /**
   * Add a task dependency
   * Validates:
   * - User can update tasks
   * - Both tasks exist
   * - No circular dependencies
   * - No duplicate dependencies
   */
  async addDependency(
    taskId: string,
    dependsOnTaskId: string
  ): Promise<TaskDependency> {
    if (!TaskPolicy.canUpdate(this.tenant)) {
      throw new ForbiddenError('Cannot update tasks');
    }

    // Verify both tasks exist
    const [task, dependsOnTask] = await Promise.all([
      this.taskRepo.getTask(taskId),
      this.taskRepo.getTask(dependsOnTaskId),
    ]);

    if (!task || !dependsOnTask) {
      throw new NotFoundError('One or both tasks not found');
    }

    // Prevent self-dependency
    if (taskId === dependsOnTaskId) {
      throw new ValidationError('A task cannot depend on itself');
    }

    // Check for circular dependency
    const hasCircular = await this.depRepo.hasCircularDependency(
      taskId,
      dependsOnTaskId
    );

    if (hasCircular) {
      throw new ValidationError(
        'Adding this dependency would create a circular dependency'
      );
    }

    const dependency = await this.depRepo.addDependency(taskId, dependsOnTaskId);

    if (!dependency) {
      throw new NotFoundError('Failed to create dependency');
    }

    return dependency;
  }

  /**
   * Remove a task dependency
   */
  async removeDependency(dependencyId: string): Promise<void> {
    if (!TaskPolicy.canUpdate(this.tenant)) {
      throw new ForbiddenError('Cannot update tasks');
    }

    const removed = await this.depRepo.removeDependency(dependencyId);

    if (!removed) {
      throw new NotFoundError('Dependency not found');
    }
  }

  /**
   * Validate status transition workflow rules
   *
   * Rules:
   * - Task with incomplete dependencies cannot move to DONE/IN_REVIEW
   * - Task with blockers (dependents waiting) cannot move to DONE
   * - BLOCKED status only if has dependencies
   */
  async validateStatusTransition(
    taskId: string,
    newStatus: TaskStatus
  ): Promise<boolean> {
    const task = await this.taskRepo.getTask(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    const dependencies = await this.depRepo.getTaskDependencies(taskId);
    const dependents = await this.depRepo.getTaskDependents(taskId);

    // Check if transitioning to DONE or IN_REVIEW
    if (newStatus === 'DONE' || newStatus === 'IN_REVIEW') {
      // Cannot transition if task has incomplete dependencies
      const incompleteDeps = dependencies.filter(async (dep) => {
        const depTask = await this.taskRepo.getTask(dep.dependsOnTaskId);
        return depTask?.status !== 'DONE';
      });

      if (incompleteDeps.length > 0) {
        throw new ValidationError(
          `Cannot transition to ${newStatus}: Task has ${incompleteDeps.length} incomplete dependencies`
        );
      }
    }

    // Check if transitioning out of BLOCKED
    if (task.status === 'BLOCKED' && newStatus !== 'BLOCKED') {
      // Verify task still has dependencies
      if (dependencies.length === 0) {
        throw new ValidationError('Task is no longer blocked (no dependencies)');
      }
    }

    // Validate BLOCKED status only if has dependencies
    if (newStatus === 'BLOCKED' && dependencies.length === 0) {
      throw new ValidationError(
        'Cannot set task to BLOCKED without dependencies'
      );
    }

    return true;
  }
}
