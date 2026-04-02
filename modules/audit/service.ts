import { prisma } from '@/lib/db';

/**
 * Audit Service
 * 
 * Static logging service that records actions without throwing errors
 * Called from all major operations to create audit trail
 * Never throws - ensures logging failures don't break main application
 */

export class AuditService {
  /**
   * Generic audit log entry
   * Never throws - catches and logs errors silently
   */
  static async log(entry: {
    workspaceId: string;
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    details?: string;
  }): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          workspaceId: entry.workspaceId,
          userId: entry.userId,
          action: entry.action as any, // Cast to AuditAction enum
          entityType: entry.entityType,
          entityId: entry.entityId,
          details: entry.details || null,
        },
      });
    } catch (error) {
      // Never throw - logging should not break main operations
      console.error('[AuditService] Failed to log action:', {
        action: entry.action,
        entity: entry.entityType,
        error,
      });
    }
  }
}
