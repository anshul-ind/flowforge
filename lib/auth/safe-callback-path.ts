/**
 * Restrict post-auth redirects to same-app relative paths (mitigate open redirects).
 */
export function safeCallbackPath(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== 'string') return null
  let s = raw.trim()
  try {
    s = decodeURIComponent(s).trim()
  } catch {
    // use trimmed raw
  }
  if (!s.startsWith('/') || s.startsWith('//')) return null
  if (s.includes('://')) return null
  return s
}
