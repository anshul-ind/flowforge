import { z } from 'zod'
import { TaskStatus } from '@/lib/generated/prisma'

export const projectTaskUrlSchema = z.object({
  q: z.string().max(200).optional().default(''),
  status: z.nativeEnum(TaskStatus).optional(),
  assigneeId: z.string().optional(),
  due: z.enum(['all', 'overdue', 'upcoming']).default('all'),
})

export type ProjectTaskUrlFilters = z.infer<typeof projectTaskUrlSchema>

function pick(sp: Record<string, string | string[] | undefined>, key: string) {
  const v = sp[key]
  return Array.isArray(v) ? v[0] : v
}

export function parseProjectTaskUrlSearchParams(
  sp: Record<string, string | string[] | undefined>
): ProjectTaskUrlFilters {
  const raw = {
    q: pick(sp, 'q') ?? '',
    status: pick(sp, 'status') || undefined,
    assigneeId: pick(sp, 'assigneeId') || undefined,
    due: pick(sp, 'due') || undefined,
  }
  const parsed = projectTaskUrlSchema.safeParse(raw)
  if (parsed.success) return parsed.data
  return { q: '', due: 'all' }
}
