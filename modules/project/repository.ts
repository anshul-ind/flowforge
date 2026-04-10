import { TenantContext } from '@/lib/tenant/tenant-context';
import { prisma } from '@/lib/db';
import { Project, ProjectStatus } from '@/lib/generated/prisma';

/**
 * Project Repository
 * 
 * Data access layer for project operations.
 * All queries are scoped to the current workspace to prevent cross-tenant access.
 */
export class ProjectRepository {
  constructor(private tenant: TenantContext) {}

  /**
   * Get all projects in the workspace
   * Can filter by status (PLANNED, ACTIVE, ARCHIVED, etc.)
   */
  async listProjects(filters?: {
    status?: ProjectStatus;
  }): Promise<Project[]> {
    const statusFilter = filters?.status ? { status: filters.status } : {}

    if (this.tenant.restrictedProjectId) {
      return await prisma.project.findMany({
        where: {
          workspaceId: this.tenant.workspaceId,
          id: this.tenant.restrictedProjectId,
          ...statusFilter,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (this.tenant.role === 'TASK_ASSIGNEE') {
      return await prisma.project.findMany({
        where: {
          workspaceId: this.tenant.workspaceId,
          ...statusFilter,
          OR: [
            { tasks: { some: { assigneeId: this.tenant.userId } } },
            {
              tasks: {
                some: { assignees: { some: { userId: this.tenant.userId } } },
              },
            },
            {
              members: {
                some: { userId: this.tenant.userId, status: 'ACTIVE' },
              },
            },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return await prisma.project.findMany({
      where: {
        workspaceId: this.tenant.workspaceId,
        ...statusFilter,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get project by ID
   * Enforces workspace scoping
   */
  async getProject(projectId: string): Promise<Project | null> {
    const row = await prisma.project.findFirst({
      where: {
        id: projectId,
        workspaceId: this.tenant.workspaceId,
      },
    });
    if (!row) return null;

    if (
      this.tenant.restrictedProjectId &&
      projectId !== this.tenant.restrictedProjectId
    ) {
      return null
    }

    if (this.tenant.role === 'TASK_ASSIGNEE') {
      const allowed = await prisma.project.findFirst({
        where: {
          id: projectId,
          workspaceId: this.tenant.workspaceId,
          OR: [
            { tasks: { some: { assigneeId: this.tenant.userId } } },
            {
              tasks: {
                some: { assignees: { some: { userId: this.tenant.userId } } },
              },
            },
            {
              members: {
                some: { userId: this.tenant.userId, status: 'ACTIVE' },
              },
            },
          ],
        },
        select: { id: true },
      });
      if (!allowed) return null;
    }

    return row;
  }

  /**
   * Create a new project in the workspace
   */
  async createProject(data: {
    title: string;
    description?: string;
    status?: ProjectStatus;
    dueDate?: Date;
  }): Promise<Project> {
    const { title, description, status, dueDate } = data
    return await prisma.project.create({
      data: {
        title,
        description,
        status,
        dueDate,
        workspaceId: this.tenant.workspaceId,
        createdById: this.tenant.userId,
      },
    })
  }

  /**
   * Update project
   * Enforces workspace scoping
   */
  async updateProject(
    projectId: string,
    data: {
      title?: string;
      description?: string | null;
      status?: ProjectStatus;
      dueDate?: Date | null;
    }
  ): Promise<Project | null> {
    const project = await this.getProject(projectId);
    if (!project) return null;

    const { title, description, status, dueDate } = data
    return await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(title ? { title } : {}),
        ...(description !== undefined ? { description: description ?? null } : {}),
        ...(status ? { status } : {}),
        ...(dueDate !== undefined ? { dueDate } : {}),
      },
    })
  }

  /**
   * Delete project
   * Must verify workspace membership first
   */
  async deleteProject(projectId: string): Promise<Project | null> {
    const project = await this.getProject(projectId);
    if (!project) return null;

    return await prisma.project.delete({
      where: { id: projectId },
    });
  }

  /**
   * Archive project (soft delete pattern)
   */
  async archiveProject(projectId: string): Promise<Project | null> {
    return await this.updateProject(projectId, { status: 'ARCHIVED' });
  }

  /**
   * Get project task count
   * For UI/analytics
   */
  async getTaskCount(projectId: string): Promise<number> {
    const project = await this.getProject(projectId);
    if (!project) return 0;

    return await prisma.task.count({
      where: { projectId },
    });
  }
}
