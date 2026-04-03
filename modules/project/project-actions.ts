'use server';

import { z } from 'zod';
import { requireUser } from '@/lib/auth/require-user';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { parseFormData } from '@/lib/validation/parse';
import { successResult, errorResult, ActionResult } from '@/types/action-result';
import { ProjectService } from './service';
import { createProjectSchema } from './schemas';
import { Project } from '@/lib/generated/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Create Project Server Action
 * 
 * Creates a new project in the workspace with validation and authorization checks
 * 
 * @example
 * const result = await createProjectAction(workspaceId, formData);
 * if (result.success) {
 *   console.log('Created:', result.data);
 * } else {
 *   console.error('Error:', result.fieldErrors);
 * }
 */
export async function createProjectAction(
  workspaceId: string,
  formData: FormData
): Promise<ActionResult<{ id: string; title: string }>> {
  try {
    console.log('[Project Action] Starting project creation for workspace:', workspaceId);

    // 1. Require authentication
    console.log('[Project Action] Step 1: Authenticate user');
    const user = await requireUser();
    console.log('[Project Action] User authenticated:', user.id, user.email);

    // 2. Resolve tenant context
    console.log('[Project Action] Step 2: Resolve tenant context');
    const tenant = await resolveTenantContext(workspaceId, user.id);
    console.log('[Project Action] Tenant context:', tenant ? `${tenant.role} in workspace ${tenant.workspaceId}` : 'Not found');
    
    if (!tenant) {
      console.error('[Project Action] ERROR: Workspace access denied');
      return errorResult('Workspace access denied');
    }

    // 3. Parse and validate input
    console.log('[Project Action] Step 3: Parse and validate input');
    const titleRaw = formData.get('title') ?? formData.get('name')
    const formDataObj = {
      title: titleRaw,
      description: formData.get('description'),
      dueDate: formData.get('dueDate'),
    }
    console.log('[Project Action] Form data:', JSON.stringify(formDataObj));

    const parseResult = parseFormData(createProjectSchema, formDataObj);
    console.log('[Project Action] Parse result:', parseResult.success ? 'Valid' : 'Invalid');

    if (!parseResult.success) {
      console.error('[Project Action] Validation errors:', parseResult.fieldErrors);
      return parseResult;
    }

    // Narrow the type - after success check, data should be defined
    const validData = parseResult.data;
    if (!validData) {
      console.error('[Project Action] ERROR: validData is undefined after successful parse');
      return errorResult('Validation failed');
    }

    console.log('[Project Action] Parsed data:', JSON.stringify(validData));

    // 4. Create project via service (includes authorization check)
    console.log('[Project Action] Step 4: Check authorization');
    const service = new ProjectService(tenant);
    
    // Validate and parse dueDate if provided
    let parsedDueDate: Date | undefined;
    if (validData.dueDate) {
      try {
        console.log('[Project Action] Parsing due date:', validData.dueDate);
        parsedDueDate = new Date(validData.dueDate);
        // Check if date is valid
        if (isNaN(parsedDueDate.getTime())) {
          console.error('[Project Action] ERROR: Invalid due date');
          return errorResult('Invalid due date format');
        }
        console.log('[Project Action] Due date parsed successfully:', parsedDueDate);
      } catch (dateError) {
        console.error('[Project Action] Date parsing error:', dateError);
        return errorResult('Invalid due date format');
      }
    }

    console.log('[Project Action] Step 5: Create project in database');
    const project = await service.createProject({
      title: validData.title,
      description: validData.description || undefined,
      dueDate: parsedDueDate,
    });
    console.log('[Project Action] Project created:', project.id, project.title);

    // 5. Revalidate cache
    console.log('[Project Action] Step 6: Revalidate cache');
    revalidatePath(`/workspace/${workspaceId}/projects`);

    // 6. Return success
    console.log('[Project Action] SUCCESS: Project creation completed');
    return successResult(
      { id: project.id, title: project.title },
      'Project created successfully!'
    );
  } catch (error) {
    console.error('[Project Action] CAUGHT ERROR:', error);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('[Project Action] Error message:', error.message);
      console.error('[Project Action] Error name:', error.name);
      console.error('[Project Action] Error stack:', error.stack);
    }
    
    return errorResult(
      error instanceof Error ? error.message : 'Failed to create project. Please try again.'
    );
  }
}
