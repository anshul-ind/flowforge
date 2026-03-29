import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import prisma from '@/lib/db'

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tenant: string }>
}) {
  const { tenant: tenantSlug } = await params
  const session = await getSession()
  if (!session) redirect('/auth/signin')

  const membership = await prisma.tenantMember.findFirst({
    where: { userId: session.userId, tenant: { slug: tenantSlug } },
    include: { tenant: true },
  })

  if (!membership) notFound()

  const navLinks = [
    { href: `/${tenantSlug}/dashboard`, icon: '📊', label: 'Dashboard' },
    { href: `/${tenantSlug}/projects`, icon: '📁', label: 'Projects' },
  ]

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-zinc-200">
          <Link href="/tenants" className="flex items-center gap-2 text-indigo-700 font-bold text-lg">
            <span>⚡</span> FlowForge
          </Link>
          <div className="mt-3 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-sm">🏢</div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 truncate">{membership.tenant.name}</p>
              <p className="text-xs text-zinc-400 capitalize">{membership.role}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-700">
              {session.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate">{session.name}</p>
              <p className="text-xs text-zinc-400 truncate">{session.email}</p>
            </div>
          </div>
          <Link href="/auth/signout" className="flex items-center gap-2 text-xs text-zinc-400 hover:text-red-500 transition-colors">
            <span>🚪</span> Sign out
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
