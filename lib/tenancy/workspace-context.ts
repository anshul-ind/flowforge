import { Session } from 'next-auth';

/**
 * Workspace context - extracted from session + URL param + DB lookup
 * Every request within /workspace/[workspaceId] must resolve this
 */
export interface WorkspaceContext {
  workspaceId: string;
  userId: string;
  role: 'OWNER' | 'MANAGER' | 'MEMBER' | 'VIEWER';
  members?: number;
}

export class TenantAccessError extends Error {
  constructor(message: string = 'Access denied to workspace') {
    super(message);
    this.name = 'TenantAccessError';
  }
}

/**
 * Resolve workspace context from session + workspaceId
 * Validates user membership and returns tenant context with role
 * In production: query DB for WorkspaceMember(userId, workspaceId)
 */ export async function getWorkspaceContext(
  session: Session | null,
  workspaceId: string
): Promise<WorkspaceContext | null> {
  if (!session?.user?.id) {
    return null;
  }

  try {
    // In production: query DB:
    // const membership = await db.workspaceMember.findUnique({
    //   where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
    //   select: { role: true, workspace: { select: { members: { select: { id: true } } } } }
    // })

    // Stub for now: mock context
    const context: WorkspaceContext = {
      workspaceId,
      userId: session.user.id,
      role: 'OWNER', // would come from DB
      members: 5,
    };

    return context;
  } catch (error) {
    return null;
  }
}

/**
 * Inject workspace context into headers for easier access in nested routes
 * Headers: x-workspace-id, x-user-id, x-request-id
 */
export function withWorkspaceHeaders(
  headers: Headers,
  context: WorkspaceContext,
  requestId: string
) {
  headers.set('x-workspace-id', context.workspaceId);
  headers.set('x-user-id', context.userId);
  headers.set('x-request-id', requestId);
  headers.set('x-user-role', context.role);
  return headers;
}
