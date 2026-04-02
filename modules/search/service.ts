import { prisma } from '@/lib/db';
import { TenantContext } from '@/lib/tenant/tenant-context';

/**
 * Search Service
 * Handles global search across projects and tasks
 */
export class SearchService {
  constructor(private tenant: TenantContext) {}

  /**
   * Global search - searches both projects and tasks
   * Case-insensitive support with proper null/undefined handling
   */
  async globalSearch(query: string, limit: number = 20) {
    if (!query || query.trim().length === 0) {
      return { projects: [], tasks: [], query: '' };
    }

    // Normalize query for case-insensitive search
    const normalizedQuery = query.trim();

    try {
      const [projects, tasks] = await Promise.all([
        // Search projects by name or description (case-insensitive)
        prisma.project.findMany({
          where: {
            workspaceId: this.tenant.workspaceId,
            OR: [
              { name: { contains: normalizedQuery, mode: 'insensitive' } },
              { description: { contains: normalizedQuery, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
          },
          take: limit,
        }),

        // Search tasks by title or description (case-insensitive)
        prisma.task.findMany({
          where: {
            workspaceId: this.tenant.workspaceId,
            OR: [
              { title: { contains: normalizedQuery, mode: 'insensitive' } },
              { description: { contains: normalizedQuery, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            projectId: true,
            project: { select: { name: true } },
          },
          take: limit,
        }),
      ]);

      return { 
        projects: projects || [], 
        tasks: tasks || [], 
        query: normalizedQuery 
      };
    } catch (error) {
      console.error('[SearchService] globalSearch error:', error);
      // Return empty results on error instead of throwing
      return { projects: [], tasks: [], query: normalizedQuery };
    }
  }

  /**
   * Search tasks with advanced filters
   */
  async searchTasks(params: {
    query?: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    projectId?: string;
    dueBefore?: string;
    dueAfter?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, params.pageSize || 20);
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: any = {
      workspaceId: this.tenant.workspaceId,
    };

    if (params.query) {
      where.OR = [
        { title: { contains: params.query, mode: 'insensitive' } },
        { description: { contains: params.query, mode: 'insensitive' } },
      ];
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.priority) {
      where.priority = params.priority;
    }

    if (params.assigneeId) {
      where.assigneeId = params.assigneeId;
    }

    if (params.projectId) {
      where.projectId = params.projectId;
    }

    if (params.dueBefore || params.dueAfter) {
      where.dueDate = {};
      if (params.dueBefore) {
        where.dueDate.lte = new Date(params.dueBefore);
      }
      if (params.dueAfter) {
        where.dueDate.gte = new Date(params.dueAfter);
      }
    }

    // Get total count
    const total = await prisma.task.count({ where });

    // Build sort
    const orderBy: any = {};
    if (params.sortBy === 'dueDate') {
      orderBy.dueDate = params.sortOrder || 'asc';
    } else if (params.sortBy === 'priority') {
      orderBy.priority = params.sortOrder || 'asc';
    } else {
      orderBy.createdAt = params.sortOrder || 'desc';
    }

    // Fetch tasks
    const tasks = await prisma.task.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        projectId: true,
        assigneeId: true,
        project: { select: { name: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
      orderBy,
      skip,
      take: pageSize,
    });

    return {
      tasks,
      total,
      page,
      pageSize,
      hasMore: skip + pageSize < total,
    };
  }

  /**
   * Search projects with filters
   */
  async searchProjects(params: {
    query?: string;
    status?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, params.pageSize || 20);
    const skip = (page - 1) * pageSize;

    const where: any = {
      workspaceId: this.tenant.workspaceId,
    };

    if (params.query) {
      where.OR = [
        { name: { contains: params.query, mode: 'insensitive' } },
        { description: { contains: params.query, mode: 'insensitive' } },
      ];
    }

    if (params.status) {
      where.status = params.status;
    }

    const total = await prisma.project.count({ where });

    const orderBy: any = {};
    if (params.sortBy === 'dueDate') {
      orderBy.dueDate = params.sortOrder || 'asc';
    } else {
      orderBy.createdAt = params.sortOrder || 'desc';
    }

    const projects = await prisma.project.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        dueDate: true,
        createdAt: true,
        _count: { select: { tasks: true } },
      },
      orderBy,
      skip,
      take: pageSize,
    });

    return {
      projects,
      total,
      page,
      pageSize,
      hasMore: skip + pageSize < total,
    };
  }
}
