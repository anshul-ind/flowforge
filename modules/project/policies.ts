import { TenantContext } from '@/lib/tenant/tenant-context';
import { canPerform, Action, Resource } from '@/lib/permissions/role-matrix';

/**
 * Project Policies
 * 
 * Define authorization rules for project-level actions.
 */

export namespace ProjectPolicy {
  /**
   * Can user read project?
   * OWNER, MANAGER, MEMBER can read
   * VIEWER can only read
   */
  export function canRead(tenant: TenantContext): boolean {
    const result = canPerform(tenant.role, Resource.PROJECT, Action.READ_PROJECT);
    console.log('[ProjectPolicy.canRead]', { result, role: tenant.role });
    return result;
  }

  /**
   * Can user create project?
   * OWNER, MANAGER, MEMBER can create
   */
  export function canCreate(tenant: TenantContext): boolean {
    console.log('[ProjectPolicy.canCreate] Input tenant:', {
      userId: tenant.userId,
      workspaceId: tenant.workspaceId,
      role: tenant.role,
      roleType: typeof tenant.role,
    });
    const result = canPerform(tenant.role, Resource.PROJECT, Action.CREATE_PROJECT);
    console.log('[ProjectPolicy.canCreate] Result:', result);
    return result;
  }

  /**
   * Can user update project?
   * OWNER and MANAGER can update
   */
  export function canUpdate(tenant: TenantContext): boolean {
    const result = canPerform(tenant.role, Resource.PROJECT, Action.UPDATE_PROJECT);
    console.log('[ProjectPolicy.canUpdate]', { result, role: tenant.role });
    return result;
  }

  /**
   * Can user delete project?
   * Only OWNER can delete
   */
  export function canDelete(tenant: TenantContext): boolean {
    const result = canPerform(tenant.role, Resource.PROJECT, Action.DELETE_PROJECT);
    console.log('[ProjectPolicy.canDelete]', { result, role: tenant.role });
    return result;
  }

  /**
   * Can user archive project?
   * OWNER and MANAGER can archive
   */
  export function canArchive(tenant: TenantContext): boolean {
    const result = canPerform(tenant.role, Resource.PROJECT, Action.ARCHIVE_PROJECT);
    console.log('[ProjectPolicy.canArchive]', { result, role: tenant.role });
    return result;
  }
}
