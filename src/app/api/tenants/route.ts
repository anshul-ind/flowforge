import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import prisma from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const memberships = await prisma.tenantMember.findMany({
    where: { userId: session.userId },
    include: { tenant: true },
  })

  return NextResponse.json(memberships.map((m) => ({ ...m.tenant, role: m.role })))
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, slug } = body

  if (!name || !slug) {
    return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
  }

  try {
    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        members: { create: { userId: session.userId, role: 'owner' } },
      },
    })
    return NextResponse.json(tenant, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })
  }
}
