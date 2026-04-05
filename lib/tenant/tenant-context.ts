import { WorkspaceRole } from '@/lib/generated/prisma';

/**
 * Tenant Context
 * 
 * A single object that contains all tenant-related information
 * for the current request. This includes who the user is,
 * which workspace they're in, and what role they have.
 */
export type TenantContext = {
  /**
   * Authenticated user ID
   */
  userId: string;

  /**
   * Tenant root — every workspace belongs to exactly one organization.
   */
  organizationId: string;

  /**
   * Current workspace ID
   * All queries should be scoped to this workspace for tenant isolation
   */
  workspaceId: string;

  /**
   * User's role in this workspace
   * Used for authorization decisions
   */
  role: WorkspaceRole;
  
  /**
   * Optional request ID for tracing/debugging
   * Useful in logs to track a single request through the system
   */
  requestId?: string;
};

/**
 * Why use a single TenantContext object instead of passing values separately?
 * 
 * ❌ BAD: Passing values separately everywhere
 * function createProject(userId: string, workspaceId: string, role: WorkspaceRole, data: any) {
 *   // Easy to forget a parameter
 *   // Easy to pass in wrong order
 *   // Hard to add new tenant-related fields later
 * }
 * 
 * ✅ GOOD: Passing TenantContext
 * function createProject(tenant: TenantContext, data: any) {
 *   // All tenant info in one place
 *   // Can't forget userId if you have the context
 *   // Easy to add requestId, permissions, etc. later
 *   // TypeScript ensures all fields are present
 * }
 * 
 * Benefits:
 * 1. Type Safety - Can't forget userId, workspaceId, or role
 * 2. Consistency - Same structure everywhere in the app
 * 3. Extensibility - Easy to add new fields (requestId, permissions, etc.)
 * 4. Readability - Clear that these values belong together
 * 5. Refactoring - Change in one place, works everywhere
 * 
 * Real-world usage:
 * - Server Actions: const tenant = await resolveTenantContext(workspaceId);
 * - Repositories: class ProjectRepository { constructor(tenant: TenantContext) }
 * - Services: function sendNotification(tenant: TenantContext, ...)
 * - Audit Logs: createAuditLog(tenant, action, entity)
 */
