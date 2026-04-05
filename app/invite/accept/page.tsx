import { InviteFlow } from '../invite-flow'

export const dynamic = 'force-dynamic'

/** Canonical production path: /invite/accept?token=… (raw token never stored server-side). */
export default async function InviteAcceptQueryPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token = '' } = await searchParams
  return <InviteFlow token={typeof token === 'string' ? token : ''} />
}
