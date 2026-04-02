import { requireUser } from '@/lib/auth/require-user';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { TenantContext } from '@/lib/tenant/tenant-context';
import { ForbiddenError } from '@/lib/errors';

/**
 * Resolve Tenant Service Helper
 * 
 * One-liner to get authenticated user with tenant context.
 * Handles all the steps in the right order:
 * 1. Require user to be authenticated (401 if not)
 * 2. Resolve workspace membership and role (403 if not a member)
 * 3. Return TenantContext for use with services
 * 
 * Usage in Server Actions:
 * ```typescript
 * export async function createProject(workspaceId: string, data: any) {
 *   'use server';
 *   
 *   const tenant = await resolveTenantService(workspaceId);
 *   const projectService = new ProjectService(tenant);
 *   return projectService.createProject(data);
 * }
 * ```
 * 
 * Usage in API Routes:
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   try {
 *     const tenant = await resolveTenantService(req.nextUrl.searchParams.get('workspaceId')!);
 *     const projectService = new ProjectService(tenant);
 *     return NextResponse.json(await projectService.listProjects());
 *   } catch (e) {
 *     if (e instanceof ForbiddenError) return NextResponse.json(..., { status: 403 });
 *     throw e;
 *   }
 * }
 * ```
 */
export async function resolveTenantService(
  workspaceId: string,
  userId?: string
): Promise<TenantContext> {
  // Step 1: Ensure user is authenticated
  const user = await requireUser();

  // Step 2: Resolve tenant context (checks workspace membership)
  const tenant = await resolveTenantContext(workspaceId, userId || user.id);

  // Step 3: Return tenant or throw 403
  if (!tenant) {
    throw new ForbiddenError('Access denied - not a workspace member');
  }

  return tenant;
}

/**
 * Guard function for Server Actions
 * 
 * Wraps a server action to ensure authentication and tenant resolution.
 * Makes error handling cleaner in the action handler.
 * 
 * @example
 * ```typescript
 * export const createProject = withTenantGuard(
 *   async (tenant, formData) => {
 *     const name = formData.get('name');
 *     const service = new ProjectService(tenant);
 *     return service.createProject({ name });
 *   }
 * );
 * ```
 */
export function withTenantGuard<TInput, TOutput>(
  handler: (tenant: TenantContext, input: TInput) => Promise<TOutput>
) {
  return async (workspaceId: string, input: TInput): Promise<TOutput> => {
    const tenant = await resolveTenantService(workspaceId);
    return handler(tenant, input);
  };
}

/**
 * Example: How to use in a server action
 * 
 * ```typescript
 * // File: app/(dashboard)/[workspaceId]/projects/actions.ts
 * 
 * import { resolveTenantService } from '@/lib/tenant/service';
 * import { ProjectService } from '@/modules/project/service';
 * import { errorResult, successResult } from '@/types/action-result';
 * 
 * export async function createProjectAction(
 *   workspaceId: string,
 *   name: string,
 *   description?: string
 * ) {
 *   'use server';
 *   
 *   try {
 *     // Get tenant context (handles auth + workspace membership)
 *     const tenant = await resolveTenantService(workspaceId);
 *     
 *     // Create service and execute action
 *     const service = new ProjectService(tenant);
 *     const project = await service.createProject({ name, description });
 *     
 *     return successResult(project);
 *   } catch (error) {
 *     if (error instanceof ForbiddenError) {
 *       return errorResult(error.message);
 *     }
 *     
 *     // Log unexpected errors in production
 *     console.error('Failed to create project:', error);
 *     return errorResult('Failed to create project');
 *   }
 * }
 * ```
 */
