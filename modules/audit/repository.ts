import { prisma } from '@/lib/db';
import { TenantContext } from '@/lib/tenant/tenant-context';

/**
 * Audit Repository
 * 
 * Data access for audit logs
 * Scoped to workspace for tenant isolation
 */

export class AuditRepository {
  constructor(private tenant: TenantContext) {}

  /**
   * Get audit logs for workspace with pagination
   */
  async getAuditLogs(options: {
    page?: number;
    limit?: number;
    entityType?: string;
    action?: string;
  } = {}) {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      workspaceId: this.tenant.workspaceId,
    };

    if (options.entityType) {
      where.entityType = options.entityType;
    }

    if (options.action) {
      where.action = options.action;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get logs for a specific entity
   */
  async getEntityAuditLogs(entityType: string, entityId: string) {
    return await prisma.auditLog.findMany({
      where: {
        workspaceId: this.tenant.workspaceId,
        entityType,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get available entity types for filtering
   */
  async getAvailableEntityTypes(): Promise<string[]> {
    const results = await prisma.auditLog.findMany({
      where: {
        workspaceId: this.tenant.workspaceId,
      },
      distinct: ['entityType'],
      select: {
        entityType: true,
      },
    });

    return results.map((r) => r.entityType).filter(Boolean);
  }
}
