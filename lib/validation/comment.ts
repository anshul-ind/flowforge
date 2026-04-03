import { z } from 'zod'

export const addCommentSchema = z.object({
  workspaceId: z.string().min(1),
  taskId: z.string().min(1),
  body: z.string().min(1).max(2000),
})

export type AddCommentInput = z.infer<typeof addCommentSchema>
