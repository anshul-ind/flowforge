import { prisma } from "@/lib/db";
import { TenantContext } from './tenant-context';

export async function resolveTenantContext(
  workspaceId: string,
  userId: string
): Promise<TenantContext | null> {
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId,
    },
    include: {
      workspace: true,
    },
  });

  if (!membership) {
    return null;
  }

  const context: TenantContext = {
    workspaceId: membership.workspaceId,
    userId: membership.userId,
    role: membership.role,
  };

  console.log('[resolveTenantContext] Resolved:', {
    userId: context.userId,
    workspaceId: context.workspaceId,
    role: context.role,
    roleType: typeof context.role,
  });

  return context;
}