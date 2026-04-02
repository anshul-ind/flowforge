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
   * Can user approve a request?
   * All roles (OWNER, MANAGER, MEMBER) can approve (VIEWER cannot)
   * Additional check: User must be the assigned approver (checked in service)
   */
  export function canApprove(tenant: TenantContext): boolean {
    return canPerform(tenant.role, Resource.APPROVAL, Action.APPROVE);
  }

  /**
   * Can user reject an approval request?
   * OWNER and MANAGER can reject
   */
  export function canReject(tenant: TenantContext): boolean {
    return canPerform(tenant.role, Resource.APPROVAL, Action.REJECT);
  }
}
