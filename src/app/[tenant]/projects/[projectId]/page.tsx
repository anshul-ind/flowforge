import Link from 'next/link'
import { getSession } from '@/lib/session'
import prisma from '@/lib/db'
import { notFound, redirect } from 'next/navigation'

const milestoneStatusColors: Record<string, string> = {
  pending: 'bg-zinc-100 text-zinc-600',
  'in-progress': 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; projectId: string }>
}) {
  const { tenant: tenantSlug, projectId } = await params
  const session = await getSession()
  if (!session) redirect('/auth/signin')

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tenant: true,
      milestones: {
        include: { tasks: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!project || project.tenant.slug !== tenantSlug) notFound()

  const allTasks = project.milestones.flatMap((m) => m.tasks)
  const doneTasks = allTasks.filter((t) => t.status === 'done').length
  const pct = allTasks.length ? Math.round((doneTasks / allTasks.length) * 100) : 0

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href={`/${tenantSlug}/projects`} className="text-sm text-zinc-500 hover:text-zinc-700 flex items-center gap-1">
          ← Back to projects
        </Link>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{project.name}</h1>
          {project.description && <p className="mt-1 text-sm text-zinc-500">{project.description}</p>}
          <div className="mt-3 flex items-center gap-4 text-sm text-zinc-500">
            <span className="capitalize font-medium text-zinc-700">{project.status}</span>
            <span>·</span>
            <span>{project.milestones.length} milestones</span>
            <span>·</span>
            <span>{doneTasks}/{allTasks.length} tasks done</span>
            <span>·</span>
            <span>{pct}% complete</span>
          </div>
        </div>
        <Link href={`/${tenantSlug}/projects/${projectId}/milestones/new`}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          <span>+</span> Add Milestone
        </Link>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-zinc-700">Overall Progress</span>
          <span className="text-zinc-500">{pct}%</span>
        </div>
        <div className="w-full bg-zinc-100 rounded-full h-2">
          <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Milestones */}
      {project.milestones.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200">
          <div className="text-4xl mb-4">🏁</div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">No milestones yet</h3>
          <p className="text-sm text-zinc-500 mb-6">Break your project into milestones</p>
          <Link href={`/${tenantSlug}/projects/${projectId}/milestones/new`}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Add milestone
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {project.milestones.map((milestone) => {
            const done = milestone.tasks.filter((t) => t.status === 'done').length
            const total = milestone.tasks.length
            const mpct = total ? Math.round((done / total) * 100) : 0
            return (
              <Link key={milestone.id} href={`/${tenantSlug}/projects/${projectId}/milestones/${milestone.id}`}
                className="block bg-white rounded-xl border border-zinc-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-zinc-900">{milestone.title}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${milestoneStatusColors[milestone.status] ?? 'bg-zinc-100 text-zinc-600'}`}>
                        {milestone.status}
                      </span>
                    </div>
                    {milestone.description && (
                      <p className="text-sm text-zinc-400 mt-1">{milestone.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-zinc-400">{done}/{total} tasks</span>
                </div>
                <div className="mt-3 w-full bg-zinc-100 rounded-full h-1.5">
                  <div className="bg-violet-500 h-1.5 rounded-full" style={{ width: `${mpct}%` }} />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
