import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceMember } from '@/lib/workspace'
import { canSearchWorkspace } from '@/lib/permissions'
import { parseWorkspaceSearchQuery } from '@/lib/validation/search'
import { runWorkspaceSearch } from '@/lib/search/run-workspace-search'
import { ForbiddenError } from '@/lib/errors'

/**
 * Workspace-scoped search (projects + tasks), server-side filters + pagination.
 * GET /api/search?workspaceId=&q=&type=all|projects|tasks&projectId=&status=&assigneeId=&due=&page=&limit=
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = parseWorkspaceSearchQuery(request.nextUrl.searchParams)
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid query',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 422 }
      )
    }

    const input = parsed.data

    let membership
    try {
      membership = await requireWorkspaceMember(session.user.id, input.workspaceId)
    } catch (e) {
      if (e instanceof ForbiddenError) {
        return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
      }
      throw e
    }

    if (!canSearchWorkspace(membership.role)) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const { results, page, limit, total, hasMore } = await runWorkspaceSearch(
      input.workspaceId,
      input
    )

    return NextResponse.json({
      ok: true,
      page,
      limit,
      total,
      hasMore,
      results,
    })
  } catch (error) {
    console.error('[GET /api/search]', error)
    return NextResponse.json({ ok: false, error: 'Search failed' }, { status: 500 })
  }
}
