import { z } from 'zod';

/**
 * Module Template: Schemas
 * 
 * Single source of truth for validation.
 * Schemas are:
 * - Server-side only (validates untrusted input)
 * - Imported by services and actions
 * - Never duplicated in UI components
 * 
 * Naming pattern:
 * - create[Resource]Schema: Form input for creating new resource
 * - update[Resource]Schema: Form input for updating existing resource
 * - [resource]FormSchema: Any form submission
 * - [resource]Schema: General representation
 */

// Create operation: client submits these fields
export const createProjectSchema = z.object({
  name: z
    .string('Project name is required')
    .min(3, 'Project name must be at least 3 characters')
    .max(100, 'Project name must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .default(''),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

// Update operation: allows partial updates
export const updateProjectSchema = createProjectSchema.partial().strict();

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// Query filters: for repository search methods
export const projectFilterSchema = z.object({
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
  sortBy: z.enum(['name', 'createdAt']).default('createdAt'),
});

export type ProjectFilterInput = z.infer<typeof projectFilterSchema>;
