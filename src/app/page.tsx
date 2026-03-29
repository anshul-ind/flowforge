import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <span className="text-xl font-bold text-indigo-700">FlowForge</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/signin" className="text-sm font-medium text-zinc-600 hover:text-indigo-600 transition-colors">
            Sign in
          </Link>
          <Link href="/auth/signup" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex flex-col items-center text-center px-8 pt-24 pb-16">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-8">
          <span>✨</span> Multi-tenant project delivery
        </div>
        <h1 className="max-w-3xl text-5xl font-extrabold tracking-tight text-zinc-900 leading-tight">
          Ship projects faster with <span className="text-indigo-600">FlowForge</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-zinc-500 leading-relaxed">
          Manage projects, milestones, and tasks across multiple teams — all in one place. Built for modern project delivery teams.
        </p>
        <div className="mt-10 flex items-center gap-4">
          <Link href="/auth/signup" className="rounded-xl bg-indigo-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg hover:bg-indigo-700 transition-all hover:shadow-indigo-200 hover:shadow-xl">
            Start for free →
          </Link>
          <Link href="/auth/signin" className="rounded-xl border border-zinc-300 px-7 py-3.5 text-base font-semibold text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 transition-all">
            Sign in
          </Link>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full text-left">
          {[
            { icon: '🏗️', title: 'Multi-Tenant', desc: 'Isolated workspaces for each team or organization with role-based access control.' },
            { icon: '📋', title: 'Project Tracking', desc: 'Organize work into projects, milestones, and tasks with priority and status tracking.' },
            { icon: '⚡', title: 'Real-time Updates', desc: 'Keep everyone aligned with live progress tracking across all your projects.' },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="mt-16 py-8 text-center text-sm text-zinc-400 border-t border-zinc-200">
        © {new Date().getFullYear()} FlowForge. All rights reserved.
      </footer>
    </div>
  )
}
