import type { TenantContext } from '@/lib/tenant/tenant-context'

/** True when membership was created or narrowed by a project- or task-scoped invite. */
export function isScopedInviteMember(tenant: TenantContext): boolean {
  return Boolean(tenant.restrictedProjectId || tenant.restrictedTaskId)
}
