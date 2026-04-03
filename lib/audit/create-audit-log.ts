import type { AuditAction } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';

export type CreateAuditLogInput = {
  workspaceId: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  details?: string | null;
};

export async function createAuditLog(input: CreateAuditLogInput) {
  try {
    return await prisma.auditLog.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        details: input.details ?? null,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return null;
  }
}
