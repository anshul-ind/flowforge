import { WorkspaceRole } from '@/lib/generated/prisma';

/**
 * Action Types
 * Defines all possible actions in the system
 */
export enum Action {
  // Workspace
  CREATE_WORKSPACE = 'CREATE_WORKSPACE',
  READ_WORKSPACE = 'READ_WORKSPACE',
  UPDATE_WORKSPACE = 'UPDATE_WORKSPACE',
  DELETE_WORKSPACE = 'DELETE_WORKSPACE',
  INVITE_MEMBER = 'INVITE_MEMBER',
  REMOVE_MEMBER = 'REMOVE_MEMBER',
  MANAGE_ROLES = 'MANAGE_ROLES',

  // Project
  CREATE_PROJECT = 'CREATE_PROJECT',
  READ_PROJECT = 'READ_PROJECT',
  UPDATE_PROJECT = 'UPDATE_PROJECT',
  DELETE_PROJECT = 'DELETE_PROJECT',
  ARCHIVE_PROJECT = 'ARCHIVE_PROJECT',

  // Task
  CREATE_TASK = 'CREATE_TASK',
  READ_TASK = 'READ_TASK',
  UPDATE_TASK = 'UPDATE_TASK',
  DELETE_TASK = 'DELETE_TASK',
  ASSIGN_TASK = 'ASSIGN_TASK',
  BULK_UPDATE_TASKS = 'BULK_UPDATE_TASKS',

  // Comment
  CREATE_COMMENT = 'CREATE_COMMENT',
  READ_COMMENT = 'READ_COMMENT',
  UPDATE_OWN_COMMENT = 'UPDATE_OWN_COMMENT',
  DELETE_OWN_COMMENT = 'DELETE_OWN_COMMENT',
  DELETE_ANY_COMMENT = 'DELETE_ANY_COMMENT',

  // Approval
  CREATE_APPROVAL = 'CREATE_APPROVAL',
  READ_APPROVAL = 'READ_APPROVAL',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

/**
 * Resource Types
 * Defines all resources in the system
 */
export enum Resource {
  WORKSPACE = 'WORKSPACE',
  PROJECT = 'PROJECT',
  TASK = 'TASK',
  COMMENT = 'COMMENT',
  APPROVAL = 'APPROVAL',
}

/**
 * Role-Based Permission Matrix
 * 
 * Defines which actions each role can perform on each resource.
 * Acts as the single source of truth for authorization rules.
 * 
 * Design:
 * - OWNER: Full control (all actions)
 * - MANAGER: Manage projects/tasks, invite/remove members
 * - MEMBER: Create/update tasks, comment, request approvals
 * - VIEWER: Read-only access
 * 
 * @example
 * // Check if a role can perform an action
 * const canCreate = roleMatrix[role]?.[resource]?.has(Action.CREATE_PROJECT);
 * if (!canCreate) throw new ForbiddenError('Cannot create projects');
 */
export const roleMatrix: Record<
  WorkspaceRole,
  Record<Resource, Set<Action>>
> = {
  OWNER: {
    [Resource.WORKSPACE]: new Set([
      Action.READ_WORKSPACE,
      Action.UPDATE_WORKSPACE,
      Action.DELETE_WORKSPACE,
      Action.INVITE_MEMBER,
      Action.REMOVE_MEMBER,
      Action.MANAGE_ROLES,
    ]),
    [Resource.PROJECT]: new Set([
      Action.CREATE_PROJECT,
      Action.READ_PROJECT,
      Action.UPDATE_PROJECT,
      Action.DELETE_PROJECT,
      Action.ARCHIVE_PROJECT,
    ]),
    [Resource.TASK]: new Set([
      Action.CREATE_TASK,
      Action.READ_TASK,
      Action.UPDATE_TASK,
      Action.DELETE_TASK,
      Action.ASSIGN_TASK,
      Action.BULK_UPDATE_TASKS,
    ]),
    [Resource.COMMENT]: new Set([
      Action.CREATE_COMMENT,
      Action.READ_COMMENT,
      Action.UPDATE_OWN_COMMENT,
      Action.DELETE_OWN_COMMENT,
      Action.DELETE_ANY_COMMENT,
    ]),
    [Resource.APPROVAL]: new Set([
      Action.CREATE_APPROVAL,
      Action.READ_APPROVAL,
      Action.APPROVE,
      Action.REJECT,
    ]),
  },

  MANAGER: {
    [Resource.WORKSPACE]: new Set([
      Action.READ_WORKSPACE,
      Action.UPDATE_WORKSPACE,
      Action.INVITE_MEMBER,
      Action.REMOVE_MEMBER,
    ]),
    [Resource.PROJECT]: new Set([
      Action.CREATE_PROJECT,
      Action.READ_PROJECT,
      Action.UPDATE_PROJECT,
      Action.ARCHIVE_PROJECT,
    ]),
    [Resource.TASK]: new Set([
      Action.CREATE_TASK,
      Action.READ_TASK,
      Action.UPDATE_TASK,
      Action.DELETE_TASK,
      Action.ASSIGN_TASK,
      Action.BULK_UPDATE_TASKS,
    ]),
    [Resource.COMMENT]: new Set([
      Action.CREATE_COMMENT,
      Action.READ_COMMENT,
      Action.UPDATE_OWN_COMMENT,
      Action.DELETE_OWN_COMMENT,
      Action.DELETE_ANY_COMMENT,
    ]),
    [Resource.APPROVAL]: new Set([
      Action.CREATE_APPROVAL,
      Action.READ_APPROVAL,
      Action.APPROVE,
      Action.REJECT,
    ]),
  },

  MEMBER: {
    [Resource.WORKSPACE]: new Set([Action.READ_WORKSPACE]),
    [Resource.PROJECT]: new Set([
      Action.READ_PROJECT,
      Action.CREATE_PROJECT, // Members can create projects too
    ]),
    [Resource.TASK]: new Set([
      Action.CREATE_TASK,
      Action.READ_TASK,
      Action.UPDATE_TASK,
      Action.ASSIGN_TASK,
    ]),
    [Resource.COMMENT]: new Set([
      Action.CREATE_COMMENT,
      Action.READ_COMMENT,
      Action.UPDATE_OWN_COMMENT,
      Action.DELETE_OWN_COMMENT,
    ]),
    [Resource.APPROVAL]: new Set([
      Action.CREATE_APPROVAL,
      Action.READ_APPROVAL,
    ]),
  },

  VIEWER: {
    [Resource.WORKSPACE]: new Set([Action.READ_WORKSPACE]),
    [Resource.PROJECT]: new Set([Action.READ_PROJECT]),
    [Resource.TASK]: new Set([Action.READ_TASK]),
    [Resource.COMMENT]: new Set([Action.READ_COMMENT]),
    [Resource.APPROVAL]: new Set([Action.READ_APPROVAL]),
  },
};

/**
 * Check if a role can perform an action on a resource
 * 
 * @param role - User's workspace role
 * @param resource - Resource type to check permissions for
 * @param action - Action to perform
 * @returns true if action is allowed, false otherwise
 * 
 * @example
 * if (!canPerform(userRole, Resource.PROJECT, Action.DELETE_PROJECT)) {
 *   throw new ForbiddenError('Cannot delete projects');
 * }
 */
export function canPerform(
  role: WorkspaceRole,
  resource: Resource,
  action: Action
): boolean {
  return roleMatrix[role]?.[resource]?.has(action) ?? false;
}
