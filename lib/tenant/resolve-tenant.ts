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
      status: 'ACTIVE',
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

  return context;
}