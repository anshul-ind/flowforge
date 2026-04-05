/** Canonical invite acceptance URL (raw token only in query — never persisted). */
export function buildInviteAcceptUrl(appBaseUrl: string, rawToken: string): string {
  const base = appBaseUrl.replace(/\/$/, '')
  return `${base}/invite/accept?token=${encodeURIComponent(rawToken)}`
}
