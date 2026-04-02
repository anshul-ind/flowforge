import { TenantContext } from '@/lib/tenant/tenant-context';
import { canPerform, Action, Resource } from '@/lib/permissions/role-matrix';

/**
 * Task Policies
 * 
 * Define authorization rules for task-level actions.
 */

export namespace TaskPolicy {
  /**
   * Can user read task?
   * All roles (OWNER, MANAGER, MEMBER, VIEWER) can read
   */
  export function canRead(tenant: TenantContext): boolean {
    return canPerform(tenant.role, Resource.TASK, Action.READ_TASK);
  }

  /**
   * Can user create task?
   * OWNER, MANAGER, MEMBER can create
   */
  export function canCreate(tenant: TenantContext): boolean {
    return canPerform(tenant.role, Resource.TASK, Action.CREATE_TASK);
  }

  /**
   * Can user update task?
   * OWNER, MANAGER, MEMBER can update
   */
  export function canUpdate(tenant: TenantContext): boolean {
    return canPerform(tenant.role, Resource.TASK, Action.UPDATE_TASK);
  }

  /**
   * Can user delete task?
   * OWNER and MANAGER can delete
   */
  export function canDelete(tenant: TenantContext): boolean {
    return canPerform(tenant.role, Resource.TASK, Action.DELETE_TASK);
  }

  /**
   * Can user assign task to someone?
   * OWNER, MANAGER, MEMBER can assign
   */
  export function canAssign(tenant: TenantContext): boolean {
    return canPerform(tenant.role, Resource.TASK, Action.ASSIGN_TASK);
  }

  /**
   * Can user bulk update tasks?
   * OWNER, MANAGER can bulk update (expensive operation)
   */
  export function canBulkUpdate(tenant: TenantContext): boolean {
    return canPerform(tenant.role, Resource.TASK, Action.BULK_UPDATE_TASKS);
  }
}
