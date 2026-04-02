import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/require-user';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { SearchService } from '@/modules/search/service';
import { z } from 'zod';

const tasksQuerySchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assigneeId: z.string().optional(),
  projectId: z.string().optional(),
  dueBefore: z.string().optional(),
  dueAfter: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(['createdAt', 'dueDate', 'priority']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Tasks endpoint with filtering
 * GET /api/workspace/[workspaceId]/tasks?status=TODO&priority=HIGH&page=1&pageSize=20
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;

    // Auth check
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Tenant check
    const tenant = await resolveTenantContext(workspaceId, user.id);
    if (!tenant) {
      return NextResponse.json({ error: 'Workspace access denied' }, { status: 403 });
    }

    // Validation
    const { searchParams } = new URL(request.url);
    const queryObject = {
      q: searchParams.get('q') || undefined,
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      assigneeId: searchParams.get('assigneeId') || undefined,
      projectId: searchParams.get('projectId') || undefined,
      dueBefore: searchParams.get('dueBefore') || undefined,
      dueAfter: searchParams.get('dueAfter') || undefined,
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '20',
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    };

    const parseResult = tasksQuerySchema.safeParse(queryObject);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parseResult.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    // Search
    const service = new SearchService(tenant);
    const result = await service.searchTasks(parseResult.data);

    return NextResponse.json({
      data: result.tasks,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    console.error('[Tasks API]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
