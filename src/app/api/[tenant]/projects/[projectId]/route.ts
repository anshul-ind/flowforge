import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import prisma from '@/lib/db'

async function getTenantAndVerify(tenantSlug: string, userId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
  if (!tenant) return null
  const member = await prisma.tenantMember.findFirst({ where: { userId, tenantId: tenant.id } })
  if (!member) return null
  return tenant
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string; projectId: string }> }
) {
  const { tenant: tenantSlug, projectId } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenant = await getTenantAndVerify(tenantSlug, session.userId)
  if (!tenant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const project = await prisma.project.findUnique({ where: { id: projectId, tenantId: tenant.id } })
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(project)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string; projectId: string }> }
) {
  const { tenant: tenantSlug, projectId } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenant = await getTenantAndVerify(tenantSlug, session.userId)
  if (!tenant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const project = await prisma.project.update({ where: { id: projectId }, data: body })
  return NextResponse.json(project)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string; projectId: string }> }
) {
  const { tenant: tenantSlug, projectId } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenant = await getTenantAndVerify(tenantSlug, session.userId)
  if (!tenant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.project.delete({ where: { id: projectId } })
  return NextResponse.json({ success: true })
}
