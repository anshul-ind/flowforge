import { TenantContext } from '@/lib/tenant/tenant-context';
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { ProjectRepository } from './repository';
import { CreateProjectInput, UpdateProjectInput } from './schemas';
import type { ProjectStatus } from '@/lib/generated/prisma';

/**
 * Module Template: Service
 * 
 * Business logic layer - orchestrates repository calls with authorization.
 * 
 * Rules:
 * 1. Authorization FIRST (before any DB access)
 * 2. Use policies for auth checks (dedicated policy module)
 * 3. Use repository for data access (no direct db calls)
 * 4. Validate input if needed (or let caller parse with Zod first)
 * 5. Transaction handling if multiple operations
 * 6. Consistent error handling (throw ForbiddenError, NotFoundError, ValidationError)
 * 
 * Benefits:
 * - Business logic is testable (mock repository)
 * - Reusable across actions, API routes, background jobs
 * - Clear separation of "can I?" (policy) vs "what happens?" (service)
 * 
 * Pattern:
 * 1. Authorization check → throw ForbiddenError
 * 2. Repository call → throws NotFoundError if needed
 * 3. Validation/business logic → throw ValidationError
 * 4. Return result
 */

export class ProjectService {
  private repo: ProjectRepository;

  constructor(private tenant: TenantContext) {
    this.repo = new ProjectRepository(tenant);
  }

  /**
   * Create new project
   * 
   * Authorization: all workspace members can create
   * (specific policies determined by ProjectPolicy)
   */
  async createProject(input: CreateProjectInput) {
    // Authorization: Who can create?
    // if (!ProjectPolicy.canCreate(this.tenant)) {
    //   throw new ForbiddenError('Cannot create projects');
    // }

    // Validation: Already done by caller (parseFormData)
    // If doing sync validation here:
    // const validated = createProjectSchema.parse(input);

    // Data access
    const project = await this.repo.create({
      title: input.title,
      description: input.description,
    });

    return project;
  }

  /**
   * Get project details
   * 
   * Authorization: all workspace members can read
   */
  async getProject(projectId: string) {
    // No authorization needed for read (all members can read)
    // if (!ProjectPolicy.canRead(this.tenant)) {
    //   throw new ForbiddenError('Cannot read projects');
    // }

    return await this.repo.findById(projectId);
    // repo.findById throws NotFoundError if not found or wrong workspace
  }

  /**
   * Get all projects in workspace
   * 
   * Authorization: all workspace members can list
   */
  async listProjects(filter?: { status?: ProjectStatus }) {
    return await this.repo.findMany(filter);
  }

  /**
   * Update project details
   * 
   * Authorization: only OWNER/MANAGER roles
   */
  async updateProject(projectId: string, input: UpdateProjectInput) {
    // Authorization: Who can update?
    // if (!ProjectPolicy.canUpdate(this.tenant)) {
    //   throw new ForbiddenError('Cannot update projects');
    // }

    return await this.repo.update(projectId, {
      title: input.title,
      description: input.description,
    });
    // repo.update throws NotFoundError if project doesn't exist or wrong workspace
  }

  /**
   * Delete project
   * 
   * Authorization: only OWNER role
   */
  async deleteProject(projectId: string) {
    // Authorization: Who can delete?
    // if (!ProjectPolicy.canDelete(this.tenant)) {
    //   throw new ForbiddenError('Cannot delete projects');
    // }

    // Business logic: Check if project can be deleted
    // Disabled in this template - implement based on requirements
    // const project = await this.repo.findById(projectId);
    // if (project.status === 'ACTIVE') {
    //   throw new ValidationError('Cannot delete active projects');
    // }

    return await this.repo.delete(projectId);
    // repo.delete throws NotFoundError if project doesn't exist or wrong workspace
  }
}
