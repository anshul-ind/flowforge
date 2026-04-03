import { TenantContext } from '@/lib/tenant/tenant-context';
import { ForbiddenError, NotFoundError } from '@/lib/errors/authorization';
import { sanitizeText } from '@/lib/input/sanitize';
import { TaskPolicy } from './policies';
import { TaskRepository } from './repository';
import { Task, TaskStatus, TaskPriority } from '@/lib/generated/prisma';
import type { TaskListDueFilter } from '@/lib/tasks/list-filters';
import { notifyTaskAssignment } from '@/modules/notification/service';

/**
 * Task Service
 * 
 * Handles task-related business logic with authorization checks.
 */
export class TaskService {
  private repo: TaskRepository;

  constructor(private tenant: TenantContext) {
    this.repo = new TaskRepository(tenant);
  }

  /**
   * Get all tasks in a project
   */
  async listProjectTasks(
    projectId: string,
    filters?: { status?: TaskStatus; assigneeId?: string; q?: string; due?: TaskListDueFilter }
  ): Promise<Task[]> {
    if (!TaskPolicy.canRead(this.tenant)) {
      throw new ForbiddenError('Cannot read tasks');
    }

    return await this.repo.listProjectTasks(projectId, filters);
  }

  /**
   * Get all tasks assigned to a user
   */
  async listUserTasks(userId: string): Promise<Task[]> {
    if (!TaskPolicy.canRead(this.tenant)) {
      throw new ForbiddenError('Cannot read tasks');
    }

    return await this.repo.listUserTasks(userId);
  }

  /**
   * Get single task by ID
   */
  async getTask(taskId: string): Promise<Task> {
    if (!TaskPolicy.canRead(this.tenant)) {
      throw new ForbiddenError('Cannot read tasks');
    }

    const task = await this.repo.getTask(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    return task;
  }

  /**
   * Create task
   * OWNER, MANAGER, MEMBER can create
   */
  async createTask(data: {
    projectId: string;
    title: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: Date;
    assigneeId?: string;
  }): Promise<Task> {
    if (!TaskPolicy.canCreate(this.tenant)) {
      throw new ForbiddenError('Cannot create tasks');
    }

    // Sanitize input
    const sanitizedData = {
      projectId: data.projectId,
      title: sanitizeText(data.title),
      description: data.description ? sanitizeText(data.description) : undefined,
      priority: data.priority,
      dueDate: data.dueDate,
      assigneeId: data.assigneeId,
    };

    const task = await this.repo.createTask(sanitizedData);
    if (!task) {
      throw new NotFoundError('Cannot create task - project or assignee invalid');
    }

    return task;
  }

  /**
   * Update task
   * OWNER, MANAGER, MEMBER can update
   */
  async updateTask(
    taskId: string,
    data: {
      title?: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      dueDate?: Date | null;
      assigneeId?: string | null;
    }
  ): Promise<Task> {
    if (!TaskPolicy.canUpdate(this.tenant)) {
      throw new ForbiddenError('Cannot update tasks');
    }

    // Get existing task to check if assignment changed
    const existingTask = await this.getTask(taskId);

    // Sanitize input
    const sanitizedData = {
      title: data.title ? sanitizeText(data.title) : undefined,
      description: data.description ? sanitizeText(data.description) : undefined,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate,
      assigneeId: data.assigneeId,
    };

    const updated = await this.repo.updateTask(taskId, sanitizedData);
    if (!updated) {
      throw new NotFoundError('Task not found');
    }

    // Notify if assignee changed
    if (sanitizedData.assigneeId && sanitizedData.assigneeId !== existingTask.assigneeId) {
      await notifyTaskAssignment(
        this.tenant,
        taskId,
        sanitizedData.assigneeId,
        updated.title
      ).catch(err => console.error('[Task] Failed to send assignment notification:', err));
    }

    return updated;
  }

  /**
   * Assign task to someone
   * OWNER, MANAGER, MEMBER can assign
   */
  async assignTask(taskId: string, assigneeId: string | null): Promise<Task> {
    if (!TaskPolicy.canAssign(this.tenant)) {
      throw new ForbiddenError('Cannot assign tasks');
    }

    // Verify task exists
    const existingTask = await this.getTask(taskId);

    const updated = await this.repo.updateTask(taskId, { assigneeId });
    if (!updated) {
      throw new NotFoundError('Task not found or invalid assignee');
    }

    // Notify if assigning to someone (not unassigning)
    if (assigneeId && assigneeId !== existingTask.assigneeId) {
      await notifyTaskAssignment(
        this.tenant,
        taskId,
        assigneeId,
        updated.title
      ).catch(err => console.error('[Task] Failed to send assignment notification:', err));
    }

    return updated;
  }

  /**
   * Delete task
   * OWNER and MANAGER can delete
   */
  async deleteTask(taskId: string): Promise<void> {
    if (!TaskPolicy.canDelete(this.tenant)) {
      throw new ForbiddenError('Cannot delete tasks');
    }

    // Verify task exists
    await this.getTask(taskId);

    const deleted = await this.repo.deleteTask(taskId);
    if (!deleted) {
      throw new NotFoundError('Task not found');
    }
  }

  /**
   * Bulk update tasks (e.g., change status in kanban)
   * OWNER and MANAGER only
   */
  async bulkUpdateTasks(
    taskIds: string[],
    data: {
      status?: TaskStatus;
      priority?: TaskPriority;
      assigneeId?: string | null;
    }
  ): Promise<void> {
    if (!TaskPolicy.canBulkUpdate(this.tenant)) {
      throw new ForbiddenError('Cannot bulk update tasks');
    }

    await this.repo.bulkUpdateTasks(taskIds, data);
  }
}
