'use server';

import { auth } from '@/auth';
import { createWorkspaceService } from '@/modules/workspace/service';
import { createWorkspaceSchema } from '@/modules/workspace/schemas';
import { generateSlug } from '@/lib/utils/slug-generator';
import { ActionResult } from '@/types/action-result';
import { Workspace } from '@/lib/generated/prisma';
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';

/**
 * Create a new workspace
 * 
 * Server Action
 * POST /api/workspace/create-action
 * 
 * Flow:
 * 1. Get authenticated session (must be logged in)
 * 2. Validate input against schema
 * 3. Generate slug from name
 * 4. Call workspaceService.create()
 * 5. Return ActionResult with workspace data
 * 
 * Errors:
 * - ValidationError: Input validation failed (fieldErrors)
 * - NotFoundError: User session not found
 * - ForbiddenError: User not authenticated
 */
export async function createWorkspaceAction(
  input: unknown
): Promise<ActionResult<Workspace>> {
  try {
    // Get session
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'You must be logged in to create a workspace',
      };
    }

    // Validate input
    const parsed = createWorkspaceSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: 'Invalid workspace details',
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const { name } = parsed.data;

    // Generate slug from name
    const slug = generateSlug(name);
    if (!slug) {
      return {
        success: false,
        message: 'Workspace name must contain at least one alphanumeric character',
      };
    }

    // Create workspace
    const workspace = await createWorkspaceService(name, slug, session.user.id);

    return {
      success: true,
      message: 'Workspace created successfully',
      data: workspace,
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        success: false,
        message: error.message,
      };
    }

    if (error instanceof NotFoundError) {
      return {
        success: false,
        message: error.message,
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        success: false,
        message: error.message,
      };
    }

    console.error('Error creating workspace:', error);
    return {
      success: false,
      message: 'Failed to create workspace. Please try again.',
    };
  }
}
