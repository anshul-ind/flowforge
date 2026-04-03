import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

/**
 * List workspaces for the currently authenticated user.
 * Tenant-safe: only returns workspaces where the user has an ACTIVE membership.
 */
export async function GET() {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId, status: 'ACTIVE' },
    select: {
      role: true,
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: {
      workspace: {
        createdAt: 'desc',
      },
    },
  })

  return NextResponse.json({
    ok: true,
    workspaces: memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      role: m.role,
    })),
  })
}

