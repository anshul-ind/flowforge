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

/**
 * Same as safeCallbackPath but also accepts absolute URLs that match `baseUrl` origin.
 * Returns a safe relative path (pathname + search) or null.
 */
export function safeCallbackFromUrl(
  url: string | null | undefined,
  baseUrl: string
): string | null {
  if (url == null || typeof url !== 'string') return null

  let u = url.trim()
  try {
    u = decodeURIComponent(u).trim()
  } catch {
    // use trimmed raw
  }

  // Fast path: already a relative path
  const direct = safeCallbackPath(u)
  if (direct) return direct

  // Allow absolute URL only if same origin as baseUrl
  try {
    const base = new URL(baseUrl)
    const parsed = new URL(u, baseUrl)
    if (parsed.origin !== base.origin) return null
    const pathWithQuery = `${parsed.pathname}${parsed.search}`
    return safeCallbackPath(pathWithQuery)
  } catch {
    return null
  }
}
