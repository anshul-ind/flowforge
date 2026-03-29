'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import prisma from '@/lib/db'

export async function createProject(tenantSlug: string, formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/auth/signin')

  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
  if (!tenant) throw new Error('Tenant not found')

  const member = await prisma.tenantMember.findFirst({
    where: { userId: session.userId, tenantId: tenant.id },
  })
  if (!member) throw new Error('Not a member')

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const status = formData.get('status') as string

  const project = await prisma.project.create({
    data: { name, description: description || null, status: status || 'active', tenantId: tenant.id },
  })

  revalidatePath(`/${tenantSlug}/projects`)
  redirect(`/${tenantSlug}/projects/${project.id}`)
}

export async function createMilestone(tenantSlug: string, projectId: string, formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/auth/signin')

  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
  if (!tenant) throw new Error('Tenant not found')

  const member = await prisma.tenantMember.findFirst({
    where: { userId: session.userId, tenantId: tenant.id },
  })
  if (!member) throw new Error('Not a member')

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const dueDateStr = formData.get('dueDate') as string

  const milestone = await prisma.milestone.create({
    data: {
      title,
      description: description || null,
      dueDate: dueDateStr ? new Date(dueDateStr) : null,
      projectId,
    },
  })

  revalidatePath(`/${tenantSlug}/projects/${projectId}`)
  redirect(`/${tenantSlug}/projects/${projectId}/milestones/${milestone.id}`)
}

export async function createTask(milestoneId: string, formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/auth/signin')

  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: { project: { include: { tenant: true } } },
  })
  if (!milestone) throw new Error('Milestone not found')

  const member = await prisma.tenantMember.findFirst({
    where: { userId: session.userId, tenantId: milestone.project.tenantId },
  })
  if (!member) throw new Error('Not a member')

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const priority = formData.get('priority') as string

  await prisma.task.create({
    data: { title, description: description || null, priority: priority || 'medium', milestoneId },
  })

  const tenantSlug = milestone.project.tenant.slug
  const projectId = milestone.projectId
  revalidatePath(`/${tenantSlug}/projects/${projectId}/milestones/${milestoneId}`)
  redirect(`/${tenantSlug}/projects/${projectId}/milestones/${milestoneId}`)
}

export async function updateTaskStatus(taskId: string, status: string) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { milestone: { include: { project: { include: { tenant: true } } } } },
  })
  if (!task) throw new Error('Task not found')

  const member = await prisma.tenantMember.findFirst({
    where: { userId: session.userId, tenantId: task.milestone.project.tenantId },
  })
  if (!member) throw new Error('Not a member')

  await prisma.task.update({ where: { id: taskId }, data: { status } })

  const tenantSlug = task.milestone.project.tenant.slug
  const projectId = task.milestone.projectId
  const milestoneId = task.milestoneId
  revalidatePath(`/${tenantSlug}/projects/${projectId}/milestones/${milestoneId}`)
}

export async function createTenant(formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/auth/signin')

  const name = formData.get('name') as string
  const slug = formData.get('slug') as string

  if (!name || !slug) throw new Error('Name and slug are required')

  await prisma.tenant.create({
    data: {
      name,
      slug,
      members: { create: { userId: session.userId, role: 'owner' } },
    },
  })

  revalidatePath('/tenants')
  redirect('/tenants')
}
