import { z } from 'zod';
import { WorkspaceRole } from '@/lib/generated/prisma';

/**
 * Workspace Validation Schemas
 * 
 * Single source of truth for workspace field validation.
 * Used in service layer and server actions.
 */

/**
 * Create Workspace Schema
 * Validates new workspace creation form
 * 
 * Rules:
 * - name: 3-50 chars, required
 * - slug: auto-generated from name (not user input)
 */
export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(3, 'Workspace name must be at least 3 characters')
    .max(50, 'Workspace name must be at most 50 characters'),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

/**
 * Update Workspace Schema
 * Validates workspace settings updates
 */
export const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(3, 'Workspace name must be at least 3 characters')
    .max(50, 'Workspace name must be at most 50 characters')
    .optional(),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
});

export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;

/**
 * Invite Member Schema
 * Validates member invitation form
 * 
 * Rules:
 * - email: must be valid email (user must exist in database)
 * - role: must be MEMBER, MANAGER, or OWNER (VIEWER not invitable)
 */
export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z
    .enum(['MEMBER', 'MANAGER', 'OWNER'] as const)
    .default('MEMBER'),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

/**
 * Update Member Role Schema
 * Validates role change form
 */
export const updateMemberRoleSchema = z.object({
  memberId: z.string().min(1, 'Member ID is required'),
  role: z
    .enum(['MEMBER', 'MANAGER', 'OWNER', 'VIEWER'] as const),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

/**
 * Remove Member Schema
 * Validates member removal
 */
export const removeMemberSchema = z.object({
  memberId: z.string().min(1, 'Member ID is required'),
});

export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;

/**
 * Delete Workspace Schema
 * Confirms deletion (requires workspace name)
 */
export const deleteWorkspaceSchema = z.object({
  confirmation: z
    .string()
    .refine(
      (val) => val === 'DELETE',
      'You must type DELETE to confirm workspace deletion'
    ),
});

export type DeleteWorkspaceInput = z.infer<typeof deleteWorkspaceSchema>;
