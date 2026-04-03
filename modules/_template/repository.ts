import { TenantContext } from '@/lib/tenant/tenant-context';
import { prisma } from '@/lib/db';
import { NotFoundError } from '@/lib/errors';
import type { ProjectStatus } from '@/lib/generated/prisma';

/**
 * Module Template: Repository
 * 
 * Data access layer - pure database operations.
 * 
 * Rules:
 * 1. ALWAYS scope queries by workspaceId (prevent cross-tenant data leaks)
 * 2. NO business logic (that's the service's job)
 * 3. NO authorization checks (service does that first)
 * 4. Return raw database objects (service transforms if needed)
 * 5. Throw NotFoundError if resource doesn't exist
 * 6. Constructor accepts TenantContext to auto-scope all queries
 * 
 * Pattern:
 * ```
 * where: { workspaceId: this.tenant.workspaceId, ... }
 * ```
 * 
 * This ensures:
 * - Type-safe workspace scoping
 * - Same structure everywhere (predictable)
 * - Impossible to forget the scope
 */

interface CreateProjectData {
  title: string;
  description?: string;
}

interface UpdateProjectData {
  title?: string;
  description?: string;
}

export class ProjectRepository {
  constructor(private tenant: TenantContext) {}

  /**
   * Create new project in workspace
   * Guaranteed workspace-scoped by constructor
   */
  async create(data: CreateProjectData) {
    return await prisma.project.create({
      data: {
        ...data,
        workspaceId: this.tenant.workspaceId, // Explicitly set tenant scope
        createdById: this.tenant.userId,
      },
    });
  }

  /**
   * Get single project by ID
   * Throws NotFoundError if not found or wrong workspace
   */
  async findById(projectId: string) {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        workspaceId: this.tenant.workspaceId, // Auto-scoped
      },
    });

    if (!project) {
      throw new NotFoundError(`Project not found`);
    }

    return project;
  }

  /**
   * Get all projects in workspace
   * Always returns empty array if none exist (never throws)
   */
  async findMany(filter?: { status?: ProjectStatus }) {
    return await prisma.project.findMany({
      where: {
        workspaceId: this.tenant.workspaceId, // Auto-scoped
        ...(filter?.status && { status: filter.status }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update project by ID
   * Throws NotFoundError if not found or wrong workspace
   */
  async update(projectId: string, data: UpdateProjectData) {
    const project = await this.findById(projectId); // Checks workspace scope

    return await prisma.project.update({
      where: { id: projectId },
      data,
    });
  }

  /**
   * Delete project by ID
   * Throws NotFoundError if not found or wrong workspace
   */
  async delete(projectId: string) {
    await this.findById(projectId); // Checks workspace scope

    return await prisma.project.delete({
      where: { id: projectId },
    });
  }
}
