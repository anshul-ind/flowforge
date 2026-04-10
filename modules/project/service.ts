import { TenantContext } from '@/lib/tenant/tenant-context';
import { ForbiddenError, NotFoundError } from '@/lib/errors/authorization';
import { sanitizeText } from '@/lib/input/sanitize';
import { ProjectPolicy } from './policies';
import { ProjectRepository } from './repository';
import { Project, ProjectStatus } from '@/lib/generated/prisma';

/**
 * Project Service
 * 
 * Handles project-related business logic with authorization checks.
 */
export class ProjectService {
  private repo: ProjectRepository;

  constructor(private tenant: TenantContext) {
    this.repo = new ProjectRepository(tenant);
  }

  /**
   * Get all projects in workspace
   * All roles can view projects
   */
  async listProjects(filters?: { status?: ProjectStatus }): Promise<Project[]> {
    if (this.tenant.role !== 'TASK_ASSIGNEE' && !ProjectPolicy.canRead(this.tenant)) {
      throw new ForbiddenError('Cannot read projects');
    }

    return await this.repo.listProjects(filters);
  }

  /**
   * Get single project by ID
   */
  async getProject(projectId: string): Promise<Project> {
    if (this.tenant.role !== 'TASK_ASSIGNEE' && !ProjectPolicy.canRead(this.tenant)) {
      throw new ForbiddenError('Cannot read projects');
    }

    const project = await this.repo.getProject(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    return project;
  }

  /**
   * Create new project
   * OWNER, MANAGER, MEMBER can create
   */
  async createProject(data: {
    title: string;
    description?: string;
    dueDate?: Date;
  }): Promise<Project> {
    if (!ProjectPolicy.canCreate(this.tenant)) {
      throw new ForbiddenError('Cannot create projects');
    }
    if (this.tenant.restrictedProjectId || this.tenant.restrictedTaskId) {
      throw new ForbiddenError('Cannot create projects with a scoped invitation');
    }

    // Sanitize input
    const sanitizedData = {
      title: sanitizeText(data.title),
      description: data.description ? sanitizeText(data.description) : undefined,
      dueDate: data.dueDate,
    };

    return await this.repo.createProject(sanitizedData);
  }

  /**
   * Update project
   * OWNER and MANAGER can update
   */
  async updateProject(
    projectId: string,
    data: {
      title?: string;
      description?: string | null;
      status?: ProjectStatus;
      dueDate?: Date | null;
    }
  ): Promise<Project> {
    if (!ProjectPolicy.canUpdate(this.tenant)) {
      throw new ForbiddenError('Cannot update projects');
    }

    // Verify project exists and is accessible
    await this.getProject(projectId);

    // Sanitize input
    const sanitizedData = {
      title: data.title ? sanitizeText(data.title) : undefined,
      description:
        data.description === undefined
          ? undefined
          : data.description
            ? sanitizeText(data.description)
            : null,
      status: data.status,
      dueDate: data.dueDate,
    };

    const updated = await this.repo.updateProject(projectId, sanitizedData);
    if (!updated) {
      throw new NotFoundError('Project not found');
    }

    return updated;
  }

  /**
   * Archive project (soft delete)
   * OWNER and MANAGER can archive
   */
  async archiveProject(projectId: string): Promise<Project> {
    if (!ProjectPolicy.canArchive(this.tenant)) {
      throw new ForbiddenError('Cannot archive projects');
    }

    // Verify project exists
    await this.getProject(projectId);

    const archived = await this.repo.archiveProject(projectId);
    if (!archived) {
      throw new NotFoundError('Project not found');
    }

    return archived;
  }

  /**
   * Delete project
   * Only OWNER can delete
   */
  async deleteProject(projectId: string): Promise<void> {
    if (!ProjectPolicy.canDelete(this.tenant)) {
      throw new ForbiddenError('Cannot delete projects');
    }

    // Verify project exists
    await this.getProject(projectId);

    const deleted = await this.repo.deleteProject(projectId);
    if (!deleted) {
      throw new NotFoundError('Project not found');
    }
  }

  /**
   * Get task count for project
   * Used for display/analytics
   */
  async getProjectStats(projectId: string) {
    // Verify project exists and user can access it
    await this.getProject(projectId);

    const taskCount = await this.repo.getTaskCount(projectId);

    return {
      taskCount,
    };
  }
}
