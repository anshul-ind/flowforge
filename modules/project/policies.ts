import { TenantContext } from '@/lib/tenant/tenant-context';
import { canPerform, Action, Resource } from '@/lib/permissions/role-matrix';

/**
 * Project Policies
 *
 * Define authorization rules for project-level actions.
 */

export namespace ProjectPolicy {
  export function canRead(tenant: TenantContext): boolean {
    return canPerform(tenant.role, Resource.PROJECT, Action.READ_PROJECT);
  }

  export function canCreate(tenant: TenantContext): boolean {
    return canPerform(tenant.role, Resource.PROJECT, Action.CREATE_PROJECT);
  }

  export function canUpdate(tenant: TenantContext): boolean {
    return canPerform(tenant.role, Resource.PROJECT, Action.UPDATE_PROJECT);
  }

  export function canDelete(tenant: TenantContext): boolean {
    return canPerform(tenant.role, Resource.PROJECT, Action.DELETE_PROJECT);
  }

  export function canArchive(tenant: TenantContext): boolean {
    return canPerform(tenant.role, Resource.PROJECT, Action.ARCHIVE_PROJECT);
  }
}
