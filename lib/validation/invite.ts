import { z } from 'zod'

export const inviteMemberSchema = z
  .object({
    workspaceId: z.string().min(1, 'Workspace is required'),
    email: z.preprocess(
      (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
      z.string().email('Invalid email').optional()
    ),
    role: z.enum(['MANAGER', 'MEMBER', 'VIEWER']),
    mode: z.enum(['email', 'link']),
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
  })

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
