import { InviteFlow } from '../invite-flow'

export const dynamic = 'force-dynamic'

/** Canonical production path: /invite/accept?token=… (raw token never stored server-side). */
export default async function InviteAcceptQueryPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; inviteError?: string }>
}) {
  const sp = await searchParams
  const token = typeof sp.token === 'string' ? sp.token : ''
  const inviteError = typeof sp.inviteError === 'string' ? sp.inviteError : undefined
  return <InviteFlow token={token} inviteError={inviteError} />
}
