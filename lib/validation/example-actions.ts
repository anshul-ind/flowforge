/**
 * Example Server Action Usage
 * 
 * This file demonstrates how to use ActionResult and validation helpers
 * in Next.js server actions with proper tenant isolation.
 */

'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { parseFormData } from '@/lib/validation/parse';
import { successResult, errorResult, ActionResult } from '@/types/action-result';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500).optional(),
  status: z.enum(['PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']).default('PLANNED'),
});

// ============================================
// SERVER ACTIONS
// ============================================

/**
 * Create a new project
 * 
 * @example
 * // In client component
 * const formData = new FormData();
 * formData.append('name', 'New Project');
 * formData.append('description', 'Project description');
 * 
 * const result = await createProject('workspace-id', formData);
 * if (result.success) {
 *   console.log('Created:', result.data);
 * } else {
 *   console.error('Errors:', result.fieldErrors);
 * }
 */
export async function createProject(
  workspaceId: string,
  formData: FormData
): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    // 1. Validate input
    const result = parseFormData(createProjectSchema, {
      name: formData.get('name'),
      description: formData.get('description'),
      status: formData.get('status'),
    });

    if (!result.success) {
      return result; // Returns field-level errors
    }

    // 2. Verify workspace exists (authorization check would go here)
    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return errorResult('Workspace not found');
    }

    // 3. Create project with tenant isolation
    const project = await db.project.create({
      data: {
        ...result.data,
        workspaceId, // Always scoped to workspace!
      },
      select: {
        id: true,
        name: true,
      },
    });

    // 4. Return success with data
    return successResult(project, 'Project created successfully');
    
  } catch (error) {
    console.error('Failed to create project:', error);
    return errorResult('Failed to create project. Please try again.');
  }
}

/**
 * Update project
 */
export async function updateProject(
  workspaceId: string,
  projectId: string,
  formData: FormData
): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    // 1. Validate
    const updateSchema = z.object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      status: z.enum(['PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']).optional(),
    });

    const result = parseFormData(updateSchema, {
      name: formData.get('name'),
      description: formData.get('description'),
      status: formData.get('status'),
    });

    if (!result.success) return result;

    // 2. Update with tenant check
    const project = await db.project.update({
      where: {
        id: projectId,
        workspaceId, // Ensures tenant isolation!
      },
      data: result.data,
      select: {
        id: true,
        name: true,
      },
    });

    return successResult(project, 'Project updated successfully');
    
  } catch (error) {
    console.error('Failed to update project:', error);
    return errorResult('Failed to update project');
  }
}

/**
 * Delete project
 */
export async function deleteProject(
  workspaceId: string,
  projectId: string
): Promise<ActionResult> {
  try {
    // Delete with tenant check
    await db.project.delete({
      where: {
        id: projectId,
        workspaceId, // Only delete if belongs to workspace!
      },
    });

    return successResult(undefined, 'Project deleted successfully');
    
  } catch (error) {
    console.error('Failed to delete project:', error);
    return errorResult('Failed to delete project');
  }
}

// ============================================
// EXAMPLE: Client Component Usage
// ============================================

/**
 * Example client component (for reference only)
 * 
 * 'use client';
 * 
 * import { createProject } from './example-actions';
 * import { useState } from 'react';
 * 
 * export function CreateProjectForm({ workspaceId }: { workspaceId: string }) {
 *   const [errors, setErrors] = useState<Record<string, string[]>>({});
 *   const [message, setMessage] = useState('');
 * 
 *   async function handleSubmit(formData: FormData) {
 *     const result = await createProject(workspaceId, formData);
 * 
 *     if (result.success) {
 *       setMessage(result.message || 'Success!');
 *       setErrors({});
 *       // Redirect or refresh
 *     } else {
 *       setErrors(result.fieldErrors || {});
 *       setMessage(result.formError || result.message || 'Error');
 *     }
 *   }
 * 
 *   return (
 *     <form action={handleSubmit}>
 *       <input name="name" />
 *       {errors.name && <p>{errors.name[0]}</p>}
 *       
 *       <textarea name="description" />
 *       {errors.description && <p>{errors.description[0]}</p>}
 *       
 *       <button type="submit">Create Project</button>
 *       {message && <p>{message}</p>}
 *     </form>
 *   );
 * }
 */
