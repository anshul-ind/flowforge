import { safeCallbackPath } from '@/lib/auth/safe-callback-path'

/**
 * Normalized relative path after sign-in / OAuth (invite, /workspace/redirects, etc.).
 * Retries decode so double-encoded query values from redirects still sanitize safely.
 */
export function postAuthRedirectPath(callbackUrlFromQuery: string | null): string {
  let candidate = (callbackUrlFromQuery?.trim() || '/workspace/redirects')
  for (let i = 0; i < 3; i++) {
    const path = safeCallbackPath(candidate)
    if (path) return path
    try {
      candidate = decodeURIComponent(candidate)
    } catch {
      break
    }
  }
  return '/workspace/redirects'
}

/**
 * Full URL for Auth.js OAuth `callbackUrl` (Google). Use only in the browser.
 */
export function googleOAuthCallbackUrl(callbackUrlFromQuery: string | null): string {
  const path = postAuthRedirectPath(callbackUrlFromQuery)
  if (typeof window === 'undefined') {
    return path
  }
  return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`
}
