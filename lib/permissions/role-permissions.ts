import type { WorkspaceRole } from '@/lib/generated/prisma';
import {
  checkPermission,
  requirePermission,
  type Action,
  type Role,
} from '@/lib/permissions/rbac';

function toRbacRole(role: WorkspaceRole): Role {
  return role as Role;
}

export function canPerformWorkspaceAction(role: WorkspaceRole, action: Action): boolean {
  return checkPermission(toRbacRole(role), action);
}

export function requireWorkspacePermission(role: WorkspaceRole, action: Action): void {
  requirePermission(toRbacRole(role), action);
}

export function hasMinimumWorkspaceRole(
  role: WorkspaceRole,
  minimumRole: WorkspaceRole
): boolean {
  const rank: Record<WorkspaceRole, number> = {
    OWNER: 5,
    MANAGER: 4,
    MEMBER: 3,
    VIEWER: 2,
    TASK_ASSIGNEE: 1,
  };
  return rank[role] >= rank[minimumRole];
}
