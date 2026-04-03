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
    return await prisma.project.findMany({
      where: {
        workspaceId: this.tenant.workspaceId,
        ...(filters?.status && { status: filters.status }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get project by ID
   * Enforces workspace scoping
   */
  async getProject(projectId: string): Promise<Project | null> {
    return await prisma.project.findFirst({
      where: {
        id: projectId,
        workspaceId: this.tenant.workspaceId,
      },
    });
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
      description?: string;
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
        ...(description !== undefined ? { description } : {}),
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
