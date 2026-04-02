'use server';

import { requireUser } from '@/lib/auth/require-user';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { parseFormData } from '@/lib/validation/parse';
import { ActionResult, successResult, errorResult } from '@/types/action-result';
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';

/**
 * Standard Server Action Pattern
 * 
 * This is the template for all server actions in Phase-5+.
 * 
 * Flow:
 * 1. Get authenticated user (redirect to sign-in if not)
 * 2. Parse form data with schema (return field errors if invalid)
 * 3. Resolve tenant context (return 403 if not a member)
 * 4. Create service instance (already scoped)
 * 5. Call service method (handles authorization and business logic)
 * 6. Return ActionResult (success or error)
 * 
 * Responsibilities:
 * - Authentication (is user logged in?)
 * - Input parsing (is data valid?)
 * - Tenant resolution (is user a member?)
 * - Call service (delegate to business logic)
 * - Error handling (convert service errors to ActionResult)
 * - Response format (always ActionResult)
 * 
 * Never:
 * - Call db directly (use repository via service)
 * - Check authorization (service does that)
 * - Catch errors silently (log or return to client)
 * - Return raw database objects without transformation
 */

// Example: Create project action
// import { ProjectService } from '@/modules/project/service';
// import { createProjectSchema } from '@/modules/project/schemas';

// export async function createProjectAction(
//   workspaceId: string,
//   formData: FormData
// ): Promise<ActionResult> {
//   try {
//     // 1. Authenticate
//     const user = await requireUser();

//     // 2. Parse input with schema
//     const parseResult = await parseFormData(createProjectSchema, {
//       name: formData.get('name'),
//       description: formData.get('description'),
//     });

//     if (!parseResult.success) {
//       return parseResult; // Returns field errors
//     }

//     // 3. Resolve tenant context
//     const tenant = await resolveTenantContext(workspaceId);
//     if (!tenant) {
//       return errorResult('Access denied to this workspace');
//     }

//     // 4. Create service (already scoped to workspace)
//     const service = new ProjectService(tenant);

//     // 5. Call service method
//     const project = await service.createProject(parseResult.data);

//     // 6. Return success
//     return successResult(project, 'Project created successfully');
//   } catch (err) {
//     // Service throws specific errors
//     if (err instanceof ForbiddenError) {
//       return errorResult(err.message); // 403 error
//     }
//     if (err instanceof NotFoundError) {
//       return errorResult(err.message); // 404 error
//     }
//     if (err instanceof ValidationError) {
//       return errorResult(err.message); // 422 error
//     }

//     // Unexpected error
//     console.error('Unexpected error in createProjectAction:', err);
//     return errorResult('An unexpected error occurred');
//   }
// }

/**
 * CHECKLIST for new server actions:
 * 
 * □ Use 'use server' directive at top
 * □ Call requireUser() (throw if not authenticated)
 * □ Call parseFormData() (return ActionResult if invalid)
 * □ Call resolveTenantContext() (return error if not member)
 * □ Create service instance with tenant context
 * □ Call service method
 * □ Return successResult() on success
 * □ Catch ForbiddenError, NotFoundError, ValidationError
 * □ Return errorResult() for known errors
 * □ Log unexpected errors to console
 * □ Return errorResult() for unexpected errors
 * 
 * Expected errors (service throws):
 * - ForbiddenError: User doesn't have permission (403)
 * - NotFoundError: Resource not found (404)
 * - ValidationError: Business logic validation failed (422)
 * 
 * HTTP status mapping (client should interpret):
 * - success: true → 200 OK
 * - success: false, formError → 422 Unprocessable Entity
 * - success: false, fieldErrors → 422 Unprocessable Entity
 * - success: false, message (auth error) → 403 Forbidden
 * - success: false, message ("not found") → 404 Not Found
 */
