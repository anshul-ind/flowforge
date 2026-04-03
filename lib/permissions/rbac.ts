/**
 * RBAC Permission Matrix
 * Defines which roles can perform which actions
 */

export type Role = 'OWNER' | 'MANAGER' | 'MEMBER' | 'VIEWER';

export type Action =
  | 'invite_member'
  | 'remove_member'
  | 'create_project'
  | 'archive_project'
  | 'create_task'
  | 'assign_task'
  | 'update_task_status'
  | 'add_comment'
  | 'submit_for_approval'
  | 'approve_reject'
  | 'view_analytics'
  | 'view_audit_log'
  | 'manage_workspace_settings';

/**
 * Permission matrix: Role → Action → Allowed
 */
const PERMISSIONS: Record<Role, Set<Action>> = {
  OWNER: new Set([
    'invite_member',
    'remove_member',
    'create_project',
    'archive_project',
    'create_task',
    'assign_task',
    'update_task_status',
    'add_comment',
    'submit_for_approval',
    'approve_reject',
    'view_analytics',
    'view_audit_log',
    'manage_workspace_settings',
  ]),
  MANAGER: new Set([
    'invite_member', // managers can invite
    'create_project',
    'archive_project',
    'create_task',
    'assign_task',
    'update_task_status',
    'add_comment',
    'submit_for_approval',
    'approve_reject',
  ]),
  MEMBER: new Set([
    'create_task',
    'update_task_status',
    'add_comment',
    'submit_for_approval',
  ]),
  VIEWER: new Set([
    'add_comment', // viewers can comment but not change status
  ]),
};

/**
 * Check if role has permission to perform action
 *
 * @example
 * if (!checkPermission('MEMBER', 'create_project')) {
 *   throw new AuthorizationError('Only owners and managers can create projects');
 * }
 */
export function checkPermission(role: Role, action: Action): boolean {
  return PERMISSIONS[role]?.has(action) ?? false;
}

/**
 * Guard function for server actions and route handlers
 * Throws error if permission denied
 */
export function requirePermission(role: Role, action: Action): void {
  if (!checkPermission(role, action)) {
    throw new Error(`Unauthorized: ${role} cannot perform ${action}`);
  }
}

/**
 * Get all actions allowed for a role
 */
export function getAllowedActions(role: Role): Action[] {
  return Array.from(PERMISSIONS[role] ?? []);
}
