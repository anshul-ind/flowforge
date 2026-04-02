import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/require-user';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { SearchService } from '@/modules/search/service';
import { z } from 'zod';

const projectsQuerySchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(['createdAt', 'dueDate']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Projects endpoint with filtering
 * GET /api/workspace/[workspaceId]/projects?status=PLANNED&page=1&pageSize=20
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
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '20',
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    };

    const parseResult = projectsQuerySchema.safeParse(queryObject);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parseResult.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    // Search
    const service = new SearchService(tenant);
    const result = await service.searchProjects(parseResult.data);

    return NextResponse.json({
      data: result.projects,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    console.error('[Projects API]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
