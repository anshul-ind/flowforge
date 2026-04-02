import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/get-session';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { ExportService } from '@/modules/export/service';
import { ForbiddenError, NotFoundError } from '@/lib/errors/authorization';

/**
 * Export API
 * 
 * Exports project tasks with comments and reactions to CSV format
 * 
 * Query Parameters:
 * - format: 'csv' (default) or 'detailed' for detailed format with comments on separate rows
 * - workspaceId: Required - workspace the project belongs to
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // 1. Get session
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get parameters
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const format = searchParams.get('format') || 'csv';

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId query parameter is required' },
        { status: 400 }
      );
    }

    // 3. Resolve tenant context (verify user is member of workspace)
    const tenant = await resolveTenantContext(workspaceId, session.user.id);
    if (!tenant) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this workspace' },
        { status: 403 }
      );
    }

    // 4. Export tasks
    const service = new ExportService(tenant);
    let csv: string;

    if (format === 'detailed') {
      csv = await service.exportProjectTasksToDetailedCSV(projectId);
    } else {
      csv = await service.exportProjectTasksToCSV(projectId);
    }

    // 5. Return CSV file
    const filename = `tasks-${projectId}-${new Date().toISOString().split('T')[0]}.csv`;
    
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    // Handle known errors
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    // Log unexpected errors
    console.error('[Export API Error]', {
      projectId: (await params).projectId,
      error,
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
