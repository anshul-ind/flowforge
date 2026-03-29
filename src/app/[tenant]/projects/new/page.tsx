import Link from 'next/link'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { createProject } from '@/lib/actions'

export default async function NewProjectPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: tenantSlug } = await params
  const session = await getSession()
  if (!session) redirect('/auth/signin')

  const createProjectForTenant = createProject.bind(null, tenantSlug)

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-6">
        <Link href={`/${tenantSlug}/projects`} className="text-sm text-zinc-500 hover:text-zinc-700 flex items-center gap-1">
          ← Back to projects
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">New Project</h1>
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <form action={createProjectForTenant} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1.5">Project name</label>
            <input
              id="name" name="name" type="text" required
              className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
              placeholder="Website Redesign"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-zinc-700 mb-1.5">Description <span className="text-zinc-400">(optional)</span></label>
            <textarea
              id="description" name="description" rows={3}
              className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition resize-none"
              placeholder="Briefly describe the project..."
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-zinc-700 mb-1.5">Status</label>
            <select
              id="status" name="status" defaultValue="active"
              className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
            Create project
          </button>
        </form>
      </div>
    </div>
  )
}
