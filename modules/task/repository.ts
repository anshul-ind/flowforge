import { TenantContext } from '@/lib/tenant/tenant-context';
import { prisma } from '@/lib/db';
import type { Prisma } from '@/lib/generated/prisma';
import { Task, TaskStatus, TaskPriority } from '@/lib/generated/prisma';
import { taskDueWhere, taskKeywordOr, type TaskListDueFilter } from '@/lib/tasks/list-filters';

/**
 * Task Repository
 * 
 * Data access layer for task operations.
 * Enforces workspace and project boundaries.
 */
export class TaskRepository {
  constructor(private tenant: TenantContext) {}

  /**
   * Get all tasks in a project
   * Enforces workspace scoping
   */
  async listProjectTasks(projectId: string, filters?: {
    status?: TaskStatus;
    assigneeId?: string;
    q?: string;
    due?: TaskListDueFilter;
  }): Promise<Task[]> {
    const project = await prisma.project.findFirst({
      where: { id: projectId, workspaceId: this.tenant.workspaceId },
    });
    if (!project) return [];

    if (
      this.tenant.restrictedProjectId &&
      projectId !== this.tenant.restrictedProjectId
    ) {
      return [];
    }

    const dueClause = taskDueWhere(filters?.due ?? 'all');
    const qOr = taskKeywordOr(filters?.q ?? '');

    const baseWhere: Prisma.TaskWhereInput = {
      projectId,
      workspaceId: this.tenant.workspaceId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.assigneeId && { assigneeId: filters.assigneeId }),
      ...(dueClause ?? {}),
    };

    const andParts: Prisma.TaskWhereInput[] = [baseWhere];
    if (this.tenant.restrictedTaskId) {
      andParts.push({ id: this.tenant.restrictedTaskId });
    }
    if (this.tenant.role === 'TASK_ASSIGNEE') {
      andParts.push({
        OR: [
          { assigneeId: this.tenant.userId },
          { assignees: { some: { userId: this.tenant.userId } } },
        ],
      });
    }
    if (qOr) {
      andParts.push({ OR: qOr });
    }

    return await prisma.task.findMany({
      where: andParts.length > 1 ? { AND: andParts } : baseWhere,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });
  }

  /**
   * Get all tasks assigned to a user
   */
  async listUserTasks(userId: string): Promise<Task[]> {
    return await prisma.task.findMany({
      where: {
        workspaceId: this.tenant.workspaceId,
        OR: [
          { assigneeId: userId },
          { assignees: { some: { userId } } },
        ],
      },
      orderBy: { dueDate: 'asc' },
      include: {
        project: { select: { id: true, title: true } },
        assignee: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Get task by ID
   * Enforces workspace scoping
   */
  async getTask(taskId: string): Promise<Task | null> {
    if (
      this.tenant.restrictedTaskId &&
      taskId !== this.tenant.restrictedTaskId
    ) {
      return null;
    }
    return await prisma.task.findFirst({
      where: {
        id: taskId,
        workspaceId: this.tenant.workspaceId,
        ...(this.tenant.restrictedProjectId
          ? { projectId: this.tenant.restrictedProjectId }
          : {}),
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, title: true } },
      },
    });
  }

  /**
   * Create task in a project
   */
  async createTask(data: {
    projectId: string;
    title: string;
    description?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
    dueDate?: Date;
    assigneeId?: string;
  }): Promise<Task | null> {
    // Verify project belongs to workspace
    const project = await prisma.project.findFirst({
      where: { id: data.projectId, workspaceId: this.tenant.workspaceId },
    });
    if (!project) return null;

    // Verify assignee (if provided) is a workspace member
    if (data.assigneeId) {
      const isMember = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: data.assigneeId,
            workspaceId: this.tenant.workspaceId,
          },
        },
      });
      if (!isMember) return null;
    }

    return await prisma.task.create({
      data: {
        ...data,
        workspaceId: this.tenant.workspaceId,
        createdById: this.tenant.userId,
      },
      include: {
        assignee: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Update task
   * Enforces workspace scoping
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
  ): Promise<Task | null> {
    const task = await this.getTask(taskId);
    if (!task) return null;

    // Verify assignee if being changed
    if (data.assigneeId && data.assigneeId !== task.assigneeId) {
      const isMember = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: data.assigneeId,
            workspaceId: this.tenant.workspaceId,
          },
        },
      });
      if (!isMember) return null;
    }

    return await prisma.task.update({
      where: { id: taskId },
      data,
      include: {
        assignee: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Delete task
   */
  async deleteTask(taskId: string): Promise<Task | null> {
    const task = await this.getTask(taskId);
    if (!task) return null;

    return await prisma.task.delete({
      where: { id: taskId },
    });
  }

  /**
   * Bulk update tasks (e.g., change status of multiple tasks)
   * Used for kanban board operations
   */
  async bulkUpdateTasks(
    taskIds: string[],
    data: {
      status?: TaskStatus;
      priority?: TaskPriority;
      assigneeId?: string | null;
    }
  ): Promise<void> {
    // Verify all tasks belong to workspace
    const tasks = await prisma.task.findMany({
      where: {
        id: { in: taskIds },
        workspaceId: this.tenant.workspaceId,
      },
    });

    if (tasks.length !== taskIds.length) {
      throw new Error('Some tasks not found in workspace');
    }

    if (data.assigneeId) {
      const isMember = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: data.assigneeId,
            workspaceId: this.tenant.workspaceId,
          },
        },
      });
      if (!isMember) {
        throw new Error('Assignee is not a workspace member');
      }
    }

    await prisma.task.updateMany({
      where: { id: { in: taskIds } },
      data,
    });
  }
}
