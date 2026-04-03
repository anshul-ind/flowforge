import { z } from 'zod'

export const createTaskSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID required'),
  projectId: z.string().min(1, 'Project ID required'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  assigneeId: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() !== '' ? v : undefined)),
  dueDate: z.string().optional().nullable(),
  requiresApproval: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
})

export const submitForApprovalSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID required'),
  taskId: z.string().min(1, 'Task ID required'),
  submitNote: z.string().max(500, 'Note must be under 500 characters').optional(),
})

export const reviewApprovalSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID required'),
  approvalId: z.string().min(1, 'Approval ID required'),
  decision: z.enum(['APPROVE', 'REJECT']),
  rejectionReason: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.decision === 'REJECT' && !data.rejectionReason?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['rejectionReason'],
      message: 'Rejection reason is required when rejecting',
    })
  }
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type SubmitForApprovalInput = z.infer<typeof submitForApprovalSchema>
export type ReviewApprovalInput = z.infer<typeof reviewApprovalSchema>
