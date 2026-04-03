import { TenantContext } from '@/lib/tenant/tenant-context';
import { canPerform, Action, Resource } from '@/lib/permissions/role-matrix';

/**
 * Approval Policies
 * 
 * Define authorization rules for approval-level actions.
 * Approval workflow: Create request -> Assign approver -> Approve/Reject
 */

export namespace ApprovalPolicy {
  /**
   * Can user read approval request?
   * All roles can read approvals in their workspace
   */
  export function canRead(tenant: TenantContext): boolean {
    return canPerform(tenant.role, Resource.APPROVAL, Action.READ_APPROVAL);
  }

  /**
   * Can user create approval request?
   * OWNER, MANAGER, MEMBER can request approval
   */
  export function canCreate(tenant: TenantContext): boolean {
    return canPerform(tenant.role, Resource.APPROVAL, Action.CREATE_APPROVAL);
  }

  /**
   * Can user approve a request? OWNER and MANAGER (see role-matrix).
   * Service layer still requires assigned reviewer or elevated role.
   */
  export function canApprove(tenant: TenantContext): boolean {
    return canPerform(tenant.role, Resource.APPROVAL, Action.APPROVE);
  }

  /** OWNER and MANAGER can reject (see role-matrix). */
  export function canReject(tenant: TenantContext): boolean {
    return canPerform(tenant.role, Resource.APPROVAL, Action.REJECT);
  }
}
