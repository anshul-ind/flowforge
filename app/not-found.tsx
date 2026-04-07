import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="fixed inset-0 z-[200] flex min-h-screen flex-col overflow-auto bg-[var(--color-surface-raised,#ffffff)] text-[var(--color-text-primary,#000000)]">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-10 px-6 py-16 md:flex-row md:items-center md:justify-between md:gap-16 md:py-20">
        <div className="flex max-w-md flex-1 flex-col items-start text-left">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted,#404040)]">
            Error 404
          </p>
          <h1
            className="text-4xl font-semibold leading-tight md:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            We can&apos;t find this page
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[var(--color-text-secondary,#404040)]">
            The link may be broken, or the page may have moved. Try going back home to continue in
            FlowForge.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-[var(--color-brand,#000000)] px-6 py-3 text-sm font-semibold text-[var(--color-accent,#ffffff)] transition-colors hover:bg-[var(--color-brand-hover,#333333)]"
          >
            Back to home
          </Link>
        </div>

        <div
          className="relative flex w-full max-w-sm flex-1 items-center justify-center md:max-w-md"
          aria-hidden
        >
          <div className="relative aspect-square w-full max-w-[280px] md:max-w-[320px]">
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-gray-100 via-white to-gray-50 shadow-inner ring-1 ring-black/5" />
            <div className="absolute left-[12%] top-[18%] text-8xl font-black leading-none text-[var(--color-brand,#000000)] opacity-[0.07] md:text-9xl">
              404
            </div>
            <div className="absolute bottom-[20%] right-[10%] h-16 w-16 rounded-2xl bg-[var(--color-brand,#000000)] opacity-90 shadow-lg" />
            <div className="absolute right-[18%] top-[22%] h-10 w-10 rounded-full border-4 border-[var(--color-brand,#000000)] opacity-25" />
            <div className="absolute left-[20%] bottom-[28%] h-3 w-24 rounded-full bg-[var(--color-brand,#000000)] opacity-10" />
          </div>
        </div>
      </div>
    </div>
  )
}
