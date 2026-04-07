/**
 * Runs once per Node server process (Phase-8: production monitoring).
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  if (process.env.NODE_ENV !== 'production') return
  const { initServerSentry } = await import('@/lib/monitoring/sentry.server')
  initServerSentry()
}
