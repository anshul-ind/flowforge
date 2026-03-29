import Link from 'next/link'
import { getSession } from '@/lib/session'
import prisma from '@/lib/db'
import { notFound, redirect } from 'next/navigation'

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-blue-100 text-blue-700',
  paused: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default async function ProjectsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: tenantSlug } = await params
  const session = await getSession()
  if (!session) redirect('/auth/signin')

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    include: {
      projects: {
        include: {
          milestones: { include: { tasks: true } },
          _count: { select: { milestones: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!tenant) notFound()

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Projects</h1>
          <p className="mt-1 text-sm text-zinc-500">{tenant.projects.length} projects in {tenant.name}</p>
        </div>
        <Link href={`/${tenantSlug}/projects/new`} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
          <span>+</span> New Project
        </Link>
      </div>

      {tenant.projects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200">
          <div className="text-4xl mb-4">📁</div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">No projects yet</h3>
          <p className="text-sm text-zinc-500 mb-6">Create your first project to get started</p>
          <Link href={`/${tenantSlug}/projects/new`} className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
            Create project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tenant.projects.map((project) => {
            const tasks = project.milestones.flatMap((m) => m.tasks)
            const done = tasks.filter((t) => t.status === 'done').length
            const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0
            return (
              <Link key={project.id} href={`/${tenantSlug}/projects/${project.id}`}
                className="bg-white rounded-xl border border-zinc-200 p-6 hover:border-indigo-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-semibold text-zinc-900">{project.name}</h3>
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${statusColors[project.status] ?? 'bg-zinc-100 text-zinc-600'}`}>
                        {project.status}
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-sm text-zinc-500 mt-1 line-clamp-1">{project.description}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-6 text-sm text-zinc-500">
                  <span>🏁 {project._count.milestones} milestones</span>
                  <span>✅ {done}/{tasks.length} tasks</span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 bg-zinc-100 rounded-full h-1.5">
                      <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-zinc-400 w-8">{pct}%</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
