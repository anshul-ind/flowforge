import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import prisma from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string; projectId: string }> }
) {
  const { tenant: tenantSlug, projectId } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
  if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const member = await prisma.tenantMember.findFirst({ where: { userId: session.userId, tenantId: tenant.id } })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const milestones = await prisma.milestone.findMany({ where: { projectId }, orderBy: { createdAt: 'asc' } })
  return NextResponse.json(milestones)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string; projectId: string }> }
) {
  const { tenant: tenantSlug, projectId } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
  if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const member = await prisma.tenantMember.findFirst({ where: { userId: session.userId, tenantId: tenant.id } })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const milestone = await prisma.milestone.create({ data: { ...body, projectId } })
  return NextResponse.json(milestone, { status: 201 })
}
