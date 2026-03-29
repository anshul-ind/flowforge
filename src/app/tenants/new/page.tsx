import Link from 'next/link'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { createTenant } from '@/lib/actions'

export default async function NewTenantPage() {
  const session = await getSession()
  if (!session) redirect('/auth/signin')

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link href="/tenants" className="text-sm text-zinc-500 hover:text-zinc-700 flex items-center gap-1">
            ← Back to workspaces
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8">
          <h1 className="text-xl font-bold text-zinc-900 mb-1">Create a workspace</h1>
          <p className="text-sm text-zinc-500 mb-6">A workspace is where your team manages projects together.</p>
          <form action={createTenant} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1.5">Workspace name</label>
              <input
                id="name" name="name" type="text" required
                className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-zinc-700 mb-1.5">URL slug</label>
              <div className="flex rounded-lg border border-zinc-300 overflow-hidden focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition">
                <span className="px-3 py-2.5 bg-zinc-50 text-sm text-zinc-400 border-r border-zinc-300">flowforge.com/</span>
                <input
                  id="slug" name="slug" type="text" required
                  pattern="[a-z0-9-]+"
                  className="flex-1 px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none bg-white"
                  placeholder="acme-corp"
                />
              </div>
              <p className="mt-1 text-xs text-zinc-400">Lowercase letters, numbers, and hyphens only</p>
            </div>
            <button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
              Create workspace
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
