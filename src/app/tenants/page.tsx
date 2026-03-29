import Link from 'next/link'
import { getSession } from '@/lib/session'
import prisma from '@/lib/db'
import { redirect } from 'next/navigation'

export default async function TenantsPage() {
  const session = await getSession()
  if (!session) redirect('/auth/signin')

  const memberships = await prisma.tenantMember.findMany({
    where: { userId: session.userId },
    include: { tenant: { include: { _count: { select: { projects: true, members: true } } } } },
  })

  return (
    <div className="min-h-screen bg-zinc-50">
      <nav className="bg-white border-b border-zinc-200 px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-indigo-700 font-bold text-xl">
          <span>⚡</span> FlowForge
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-500">Hi, {session.name}</span>
          <Link href="/auth/signout" className="text-sm text-zinc-500 hover:text-red-600 transition-colors">Sign out</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Your Workspaces</h1>
            <p className="mt-1 text-sm text-zinc-500">Select a workspace to get started</p>
          </div>
          <Link href="/tenants/new" className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
            <span>+</span> New Workspace
          </Link>
        </div>

        {memberships.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200">
            <div className="text-4xl mb-4">🏗️</div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">No workspaces yet</h3>
            <p className="text-sm text-zinc-500 mb-6">Create your first workspace to get started</p>
            <Link href="/tenants/new" className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
              Create workspace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memberships.map(({ tenant, role }) => (
              <Link key={tenant.id} href={`/${tenant.slug}/dashboard`}
                className="group bg-white rounded-2xl border border-zinc-200 p-6 hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-xl">
                      🏢
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900 group-hover:text-indigo-700 transition-colors">{tenant.name}</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">{tenant.slug}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 capitalize">{role}</span>
                </div>
                <div className="mt-5 flex items-center gap-4 text-sm text-zinc-500">
                  <span>📁 {tenant._count.projects} projects</span>
                  <span>👥 {tenant._count.members} members</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
