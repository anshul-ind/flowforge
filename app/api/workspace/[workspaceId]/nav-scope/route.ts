import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant'

/**
 * Current user's invite scope for this workspace (for client nav trimming). Server routes enforce separately.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  const { workspaceId } = await params
  const tenant = await resolveTenantContext(workspaceId, userId)
  if (!tenant) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
  }
  return NextResponse.json({
    ok: true,
    role: tenant.role,
    restrictedProjectId: tenant.restrictedProjectId ?? null,
    restrictedTaskId: tenant.restrictedTaskId ?? null,
  })
}
