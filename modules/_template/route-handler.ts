import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/require-user';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';

/**
 * Standard Route Handler Pattern
 * 
 * This is the template for all API routes in Phase-5+.
 * 
 * Flow (same as actions, but returns JSON):
 * 1. Get authenticated user (401 if not)
 * 2. Validate request body/query (400 if invalid)
 * 3. Resolve tenant context (403 if not a member)
 * 4. Create service instance (already scoped)
 * 5. Call service method (handles authorization and business logic)
 * 6. Return JSON response
 * 
 * Responsibilities:
 * - Authentication (is user logged in?)
 * - Input validation (is data valid?)
 * - Tenant resolution (is user a member?)
 * - Call service (delegate to business logic)
 * - Error handling (convert service errors to HTTP status codes)
 * - Response format (always JSON)
 * 
 * Error responses:
 * - 400: Bad Request (invalid input)
 * - 401: Unauthorized (not logged in)
 * - 403: Forbidden (no permission)
 * - 404: Not Found (resource doesn't exist)
 * - 500: Internal Server Error (unexpected)
 */

// Example: GET /api/workspace/[id]/projects
// import { ProjectService } from '@/modules/project/service';

// export async function GET(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     // 1. Authenticate
//     const user = await requireUser();

//     // 2. Resolve tenant (workspace membership)
//     const tenant = await resolveTenantContext(params.id);
//     if (!tenant) {
//       return NextResponse.json(
//         { error: 'Access denied to this workspace' },
//         { status: 403 }
//       );
//     }

//     // 3. Create service
//     const service = new ProjectService(tenant);

//     // 4. Get projects
//     // Note: Can parse query params from request.nextUrl.searchParams
//     const projects = await service.listProjects();

//     // 5. Return success
//     return NextResponse.json(
//       { success: true, data: projects },
//       { status: 200 }
//     );
//   } catch (err) {
//     // Handle known errors
//     if (err instanceof ForbiddenError) {
//       return NextResponse.json(
//         { error: err.message },
//         { status: 403 }
//       );
//     }
//     if (err instanceof NotFoundError) {
//       return NextResponse.json(
//         { error: err.message },
//         { status: 404 }
//       );
//     }

//     // Unexpected error
//     console.error('Unexpected error in GET /api/workspace/[id]/projects:', err);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

/**
 * CHECKLIST for new route handlers:
 * 
 * □ Import NextRequest, NextResponse from 'next/server'
 * □ Call requireUser() (throw if not authenticated)
 * □ Validate request body/query with Zod
 * □ (Return 400 if invalid)
 * □ Call resolveTenantContext() (return 403 if not member)
 * □ Create service instance with tenant context
 * □ Call service method
 * □ Return NextResponse.json() with status 200
 * □ Catch ForbiddenError → 403
 * □ Catch NotFoundError → 404
 * □ Catch ValidationError → 422
 * □ Log unexpected errors
 * □ Return NextResponse.json() with 500 for unexpected errors
 * 
 * HTTP status mapping:
 * - 200: Success
 * - 400: Bad Request (validation failed)
 * - 401: Unauthorized (not authenticated)
 * - 403: Forbidden (no permission)
 * - 404: Not Found (resource doesn't exist)
 * - 422: Unprocessable Entity (business logic validation failed)
 * - 500: Internal Server Error
 * 
 * JSON response format:
 * Success: { success: true, data: {...} }
 * Error: { error: "message" } or { success: false, error: "message" }
 */
