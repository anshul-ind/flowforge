import { z } from 'zod'
import { ProjectStatus, TaskStatus } from '@/lib/generated/prisma'

const statusUnion = z.union([z.nativeEnum(TaskStatus), z.nativeEnum(ProjectStatus)])

/**
 * Query params for GET /api/search (workspace-scoped global search).
 */
export const workspaceSearchQuerySchema = z.object({
  workspaceId: z.string().min(1, 'workspaceId is required'),
  q: z.string().max(200).optional().default(''),
  type: z.enum(['all', 'projects', 'tasks']).default('all'),
  projectId: z.string().optional(),
  status: statusUnion.optional(),
  assigneeId: z.string().optional(),
  due: z.enum(['all', 'overdue', 'upcoming']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export type WorkspaceSearchQuery = z.infer<typeof workspaceSearchQuerySchema>

export function parseWorkspaceSearchQuery(searchParams: URLSearchParams) {
  const raw = {
    workspaceId: searchParams.get('workspaceId') ?? '',
    q: searchParams.get('q') ?? '',
    type: searchParams.get('type') || undefined,
    projectId: searchParams.get('projectId') || undefined,
    status: searchParams.get('status') || undefined,
    assigneeId: searchParams.get('assigneeId') || undefined,
    due: searchParams.get('due') || undefined,
    page: searchParams.get('page') || undefined,
    limit: searchParams.get('limit') || undefined,
  }
  return workspaceSearchQuerySchema.safeParse(raw)
}

const TASK_STATUSES = new Set<string>(Object.values(TaskStatus))

export function classifySearchStatus(
  status: WorkspaceSearchQuery['status']
): { taskStatus?: TaskStatus; projectStatus?: ProjectStatus } {
  if (!status) return {}
  if (TASK_STATUSES.has(status as string)) {
    return { taskStatus: status as TaskStatus }
  }
  return { projectStatus: status as ProjectStatus }
}
