import { z } from 'zod'

/**
 * FormData omits absent fields → `get()` is `null`. Zod `.optional()` allows `undefined` but not `null`.
 */
function formOptionalString(v: unknown): string | undefined {
  if (v == null) return undefined
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t === '' ? undefined : t
}

export const inviteMemberSchema = z
  .object({
    workspaceId: z.string().min(1, 'Workspace is required'),
    email: z.preprocess(formOptionalString, z.string().email('Invalid email').optional()),
    role: z.enum(['MANAGER', 'MEMBER', 'VIEWER', 'TASK_ASSIGNEE']),
    mode: z.enum(['email', 'link']),
    inviteScope: z.preprocess(
      (v) => (v === '' || v == null ? 'workspace' : v),
      z.enum(['workspace', 'project', 'task'])
    ),
    projectId: z.preprocess(formOptionalString, z.string().min(1).optional()),
    taskId: z.preprocess(formOptionalString, z.string().min(1).optional()),
  })
  .superRefine((data, ctx) => {
    if (data.mode === 'email') {
      const e = typeof data.email === 'string' ? data.email.trim() : ''
      if (!e) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['email'],
          message: 'Email is required when sending by email',
        })
      }
    }
    if (data.inviteScope === 'project' && !data.projectId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['projectId'],
        message: 'Select a project for a project-scoped invite',
      })
    }
    if (data.inviteScope === 'task' && !data.taskId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['taskId'],
        message: 'Select a task for a task-scoped invite',
      })
    }
    if (data.inviteScope === 'workspace' && (data.projectId || data.taskId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['inviteScope'],
        message: 'Clear project and task when inviting to the full workspace',
      })
    }
    if (data.inviteScope === 'project' && data.taskId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['taskId'],
        message: 'Use task scope when inviting to a single task',
      })
    }
    if (data.inviteScope === 'task' && data.role !== 'TASK_ASSIGNEE') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['role'],
        message: 'Task invites must use the Task assignee role',
      })
    }
    if (data.inviteScope === 'project' && data.role === 'TASK_ASSIGNEE') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['role'],
        message: 'Project invites cannot use the Task assignee role',
      })
    }
    if (data.inviteScope === 'project' && data.taskId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['taskId'],
        message: 'Clear the task when using project scope',
      })
    }
  })

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
