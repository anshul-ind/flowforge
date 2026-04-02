import { TenantContext } from '@/lib/tenant/tenant-context';
import { Action, Resource, canPerform } from '@/lib/permissions/role-matrix';

/**
 * Comment Policies
 * 
 * Authorization rules for comment operations
 */

export namespace CommentPolicy {
  /**
   * Can user read comments?
   * All roles can read
   */
  export function canRead(tenant: TenantContext): boolean {
    return canPerform(tenant.role, Resource.COMMENT, Action.READ_COMMENT);
  }

  /**
   * Can user create comment?
   * OWNER, MANAGER, MEMBER can create
   */
  export function canCreate(tenant: TenantContext): boolean {
    return canPerform(tenant.role, Resource.COMMENT, Action.CREATE_COMMENT);
  }

  /**
   * Can user update their own comment?
   * Author or OWNER/MANAGER can update
   */
  export function canUpdateOwn(tenant: TenantContext, isAuthor: boolean): boolean {
    if (!isAuthor && !canPerform(tenant.role, Resource.COMMENT, Action.DELETE_ANY_COMMENT)) {
      return false;
    }
    return canPerform(tenant.role, Resource.COMMENT, Action.UPDATE_OWN_COMMENT) || isAuthor;
  }

  /**
   * Can user delete a comment?
   * Author or OWNER/MANAGER can delete
   */
  export function canDelete(tenant: TenantContext, isAuthor: boolean): boolean {
    // Author can delete own
    if (isAuthor) {
      return canPerform(tenant.role, Resource.COMMENT, Action.DELETE_OWN_COMMENT);
    }
    // OWNER/MANAGER can delete any
    return canPerform(tenant.role, Resource.COMMENT, Action.DELETE_ANY_COMMENT);
  }
}
