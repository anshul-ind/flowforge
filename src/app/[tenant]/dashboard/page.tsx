import Link from 'next/link'
import { getSession } from '@/lib/session'
import prisma from '@/lib/db'
import { notFound, redirect } from 'next/navigation'

export default async function DashboardPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: tenantSlug } = await params
  const session = await getSession()
  if (!session) redirect('/auth/signin')

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    include: {
      projects: {
        include: {
          milestones: {
            include: { tasks: true },
          },
        },
      },
      members: true,
    },
  })

  if (!tenant) notFound()

  const totalProjects = tenant.projects.length
  const allMilestones = tenant.projects.flatMap((p) => p.milestones)
  const allTasks = allMilestones.flatMap((m) => m.tasks)
  const completedTasks = allTasks.filter((t) => t.status === 'done').length
  const activeProjects = tenant.projects.filter((p) => p.status === 'active').length

  const stats = [
    { label: 'Total Projects', value: totalProjects, icon: '📁', color: 'bg-indigo-50 text-indigo-700' },
    { label: 'Active Projects', value: activeProjects, icon: '🚀', color: 'bg-violet-50 text-violet-700' },
    { label: 'Total Tasks', value: allTasks.length, icon: '✅', color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Completed Tasks', value: completedTasks, icon: '🎯', color: 'bg-amber-50 text-amber-700' },
  ]

  const recentProjects = tenant.projects.slice(0, 5)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">Overview of {tenant.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-xl ${stat.color} mb-3`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
            <p className="text-sm text-zinc-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-xl border border-zinc-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 className="font-semibold text-zinc-900">Recent Projects</h2>
          <Link href={`/${tenantSlug}/projects`} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            View all →
          </Link>
        </div>
        {recentProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-3">📁</div>
            <p className="text-sm text-zinc-500 mb-4">No projects yet</p>
            <Link href={`/${tenantSlug}/projects/new`} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
              Create project
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {recentProjects.map((project) => {
              const tasks = project.milestones.flatMap((m) => m.tasks)
              const done = tasks.filter((t) => t.status === 'done').length
              const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0
              return (
                <Link key={project.id} href={`/${tenantSlug}/projects/${project.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{project.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{tasks.length} tasks · {done} completed</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-zinc-100 rounded-full h-1.5">
                      <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-zinc-400 w-8 text-right">{pct}%</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
