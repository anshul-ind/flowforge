import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'

const dbPath = path.resolve(process.cwd(), 'prisma/dev.db')
const adapter = new PrismaBetterSqlite3({ url: dbPath })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Clean up
  await prisma.task.deleteMany()
  await prisma.milestone.deleteMany()
  await prisma.project.deleteMany()
  await prisma.tenantMember.deleteMany()
  await prisma.tenant.deleteMany()
  await prisma.user.deleteMany()

  const password = await bcrypt.hash('password123', 12)

  const alice = await prisma.user.create({
    data: { name: 'Alice Johnson', email: 'alice@example.com', password },
  })

  const bob = await prisma.user.create({
    data: { name: 'Bob Smith', email: 'bob@example.com', password },
  })

  const acme = await prisma.tenant.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme',
      members: {
        create: [
          { userId: alice.id, role: 'owner' },
          { userId: bob.id, role: 'member' },
        ],
      },
    },
  })

  const project1 = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Complete overhaul of the company website',
      status: 'active',
      tenantId: acme.id,
    },
  })

  const milestone1 = await prisma.milestone.create({
    data: {
      title: 'Design Phase',
      description: 'Create wireframes and mockups',
      status: 'in-progress',
      projectId: project1.id,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  })

  await prisma.task.createMany({
    data: [
      { title: 'Create wireframes', status: 'done', priority: 'high', milestoneId: milestone1.id },
      { title: 'Design homepage mockup', status: 'in-progress', priority: 'high', milestoneId: milestone1.id },
      { title: 'Design about page', status: 'todo', priority: 'medium', milestoneId: milestone1.id },
    ],
  })

  const milestone2 = await prisma.milestone.create({
    data: {
      title: 'Development Phase',
      description: 'Build out all pages',
      status: 'pending',
      projectId: project1.id,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  await prisma.task.createMany({
    data: [
      { title: 'Set up Next.js project', status: 'todo', priority: 'high', milestoneId: milestone2.id },
      { title: 'Implement homepage', status: 'todo', priority: 'medium', milestoneId: milestone2.id },
    ],
  })

  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App',
      description: 'iOS and Android app for customers',
      status: 'active',
      tenantId: acme.id,
    },
  })

  const milestone3 = await prisma.milestone.create({
    data: {
      title: 'MVP Release',
      description: 'Core features for initial release',
      status: 'pending',
      projectId: project2.id,
    },
  })

  await prisma.task.createMany({
    data: [
      { title: 'User authentication', status: 'in-progress', priority: 'urgent', milestoneId: milestone3.id },
      { title: 'Dashboard screen', status: 'todo', priority: 'high', milestoneId: milestone3.id },
      { title: 'Push notifications', status: 'todo', priority: 'medium', milestoneId: milestone3.id },
    ],
  })

  console.log('✅ Seed complete!')
  console.log('  Users: alice@example.com, bob@example.com (password: password123)')
  console.log('  Tenant: acme (Acme Corp)')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
