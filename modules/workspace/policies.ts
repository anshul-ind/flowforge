import { TenantContext } from '@/lib/tenant/tenant-context';
import { canPerform, Action, Resource } from '@/lib/permissions/role-matrix';

/**
 * Workspace Policies
 * 
 * Define authorization rules for workspace-level actions.
 * All functions receive TenantContext to access user's role.
 * 
 * Pattern: Return true if action allowed, throw ForbiddenError if not.
 * Exceptions are for common flows where you need to make decisions.
 */

export namespace WorkspacePolicy {
  /**
   * Can user read workspace details?
   * All members can read workspace they belong to (membership already validated in TenantContext)
   */
  export function canRead(tenant: TenantContext): boolean {
    return canPerform(tenant.role, Resource.WORKSPACE, Action.READ_WORKSPACE);
  }

  /**
   * Can user update workspace settings?
   * Only OWNER and MANAGER roles
   */
  export function canUpdate(tenant: TenantContext): boolean {
    return canPerform(
      tenant.role,
      Resource.WORKSPACE,
      Action.UPDATE_WORKSPACE
    );
  }

  /**
   * Can user delete workspace?
   * Only OWNER role
   */
  export function canDelete(tenant: TenantContext): boolean {
    return canPerform(
      tenant.role,
      Resource.WORKSPACE,
      Action.DELETE_WORKSPACE
    );
  }

  /**
   * Can user invite members to workspace?
   * OWNER and MANAGER roles
   */
  export function canInviteMember(tenant: TenantContext): boolean {
    return canPerform(tenant.role, Resource.WORKSPACE, Action.INVITE_MEMBER);
  }

  /**
   * Can user remove members from workspace?
   * OWNER and MANAGER roles
   */
  export function canRemoveMember(tenant: TenantContext): boolean {
    return canPerform(tenant.role, Resource.WORKSPACE, Action.REMOVE_MEMBER);
  }

  /**
   * Can user change member roles?
   * Only OWNER role
   */
  export function canManageRoles(tenant: TenantContext): boolean {
    return canPerform(tenant.role, Resource.WORKSPACE, Action.MANAGE_ROLES);
  }
}
