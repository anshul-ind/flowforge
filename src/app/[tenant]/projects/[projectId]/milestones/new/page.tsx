import Link from 'next/link'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { createMilestone } from '@/lib/actions'

export default async function NewMilestonePage({
  params,
}: {
  params: Promise<{ tenant: string; projectId: string }>
}) {
  const { tenant: tenantSlug, projectId } = await params
  const session = await getSession()
  if (!session) redirect('/auth/signin')

  const createMilestoneForProject = createMilestone.bind(null, tenantSlug, projectId)

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-6">
        <Link href={`/${tenantSlug}/projects/${projectId}`} className="text-sm text-zinc-500 hover:text-zinc-700 flex items-center gap-1">
          ← Back to project
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">New Milestone</h1>
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <form action={createMilestoneForProject} className="space-y-5">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-zinc-700 mb-1.5">Title</label>
            <input
              id="title" name="title" type="text" required
              className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
              placeholder="Design phase"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-zinc-700 mb-1.5">Description <span className="text-zinc-400">(optional)</span></label>
            <textarea
              id="description" name="description" rows={3}
              className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition resize-none"
              placeholder="What needs to happen in this milestone?"
            />
          </div>
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-zinc-700 mb-1.5">Due date <span className="text-zinc-400">(optional)</span></label>
            <input
              id="dueDate" name="dueDate" type="date"
              className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
            />
          </div>
          <button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
            Create milestone
          </button>
        </form>
      </div>
    </div>
  )
}
