/** Not tenant workspace IDs — logo should go to /workspace, not /workspace/{seg}. */
const RESERVED_WORKSPACE_PATH_SEGMENTS = new Set(['new', 'redirects'])

/**
 * In the dashboard shell (`/workspace/...`), the FlowForge mark should not link to `/`.
 * - `/workspace` → `/workspace`
 * - `/workspace/new` or `/workspace/redirects` → `/workspace`
 * - `/workspace/{tenantId}/...` → `/workspace/{tenantId}`
 */
export function resolveAppShellLogoHref(pathname: string | null | undefined): string {
  if (!pathname?.startsWith('/workspace')) return '/'
  const m = pathname.match(/^\/workspace\/([^/]+)/)
  if (!m) return '/workspace'
  const seg = m[1]
  if (RESERVED_WORKSPACE_PATH_SEGMENTS.has(seg)) return '/workspace'
  return `/workspace/${seg}`
}
