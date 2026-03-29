import Link from 'next/link'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { createTask } from '@/lib/actions'

export default async function NewTaskPage({
  params,
}: {
  params: Promise<{ tenant: string; projectId: string; milestoneId: string }>
}) {
  const { tenant: tenantSlug, projectId, milestoneId } = await params
  const session = await getSession()
  if (!session) redirect('/auth/signin')

  const createTaskForMilestone = createTask.bind(null, milestoneId)

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-6">
        <Link href={`/${tenantSlug}/projects/${projectId}/milestones/${milestoneId}`} className="text-sm text-zinc-500 hover:text-zinc-700 flex items-center gap-1">
          ← Back to milestone
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">New Task</h1>
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <form action={createTaskForMilestone} className="space-y-5">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-zinc-700 mb-1.5">Task title</label>
            <input
              id="title" name="title" type="text" required
              className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
              placeholder="Design login page"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-zinc-700 mb-1.5">Description <span className="text-zinc-400">(optional)</span></label>
            <textarea
              id="description" name="description" rows={3}
              className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition resize-none"
              placeholder="What needs to be done?"
            />
          </div>
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-zinc-700 mb-1.5">Priority</label>
            <select
              id="priority" name="priority" defaultValue="medium"
              className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
            Create task
          </button>
        </form>
      </div>
    </div>
  )
}
