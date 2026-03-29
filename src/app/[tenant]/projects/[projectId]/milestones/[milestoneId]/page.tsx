import Link from 'next/link'
import { getSession } from '@/lib/session'
import prisma from '@/lib/db'
import { notFound, redirect } from 'next/navigation'

const priorityColors: Record<string, string> = {
  low: 'bg-zinc-100 text-zinc-500',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  urgent: 'bg-red-100 text-red-700',
}

const taskStatusColors: Record<string, string> = {
  todo: 'bg-zinc-100 text-zinc-600',
  'in-progress': 'bg-blue-100 text-blue-700',
  review: 'bg-violet-100 text-violet-700',
  done: 'bg-emerald-100 text-emerald-700',
}

export default async function MilestoneDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; projectId: string; milestoneId: string }>
}) {
  const { tenant: tenantSlug, projectId, milestoneId } = await params
  const session = await getSession()
  if (!session) redirect('/auth/signin')

  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: {
      project: { include: { tenant: true } },
      tasks: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!milestone || milestone.project.tenant.slug !== tenantSlug) notFound()

  const done = milestone.tasks.filter((t) => t.status === 'done').length
  const pct = milestone.tasks.length ? Math.round((done / milestone.tasks.length) * 100) : 0

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
        <Link href={`/${tenantSlug}/projects`} className="hover:text-zinc-700">Projects</Link>
        <span>/</span>
        <Link href={`/${tenantSlug}/projects/${projectId}`} className="hover:text-zinc-700">{milestone.project.name}</Link>
        <span>/</span>
        <span className="text-zinc-900 font-medium">{milestone.title}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{milestone.title}</h1>
          {milestone.description && <p className="mt-1 text-sm text-zinc-500">{milestone.description}</p>}
          {milestone.dueDate && (
            <p className="mt-1 text-xs text-zinc-400">Due: {new Date(milestone.dueDate).toLocaleDateString()}</p>
          )}
        </div>
        <Link href={`/${tenantSlug}/projects/${projectId}/milestones/${milestoneId}/tasks/new`}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          <span>+</span> Add Task
        </Link>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-zinc-700">Progress</span>
          <span className="text-zinc-500">{done}/{milestone.tasks.length} tasks · {pct}%</span>
        </div>
        <div className="w-full bg-zinc-100 rounded-full h-2">
          <div className="bg-violet-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Tasks */}
      {milestone.tasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">No tasks yet</h3>
          <p className="text-sm text-zinc-500 mb-6">Add tasks to track work for this milestone</p>
          <Link href={`/${tenantSlug}/projects/${projectId}/milestones/${milestoneId}/tasks/new`}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Add task
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100">
          {milestone.tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between px-5 py-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900">{task.title}</p>
                {task.description && <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{task.description}</p>}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityColors[task.priority] ?? 'bg-zinc-100 text-zinc-500'}`}>
                  {task.priority}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${taskStatusColors[task.status] ?? 'bg-zinc-100 text-zinc-600'}`}>
                  {task.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
