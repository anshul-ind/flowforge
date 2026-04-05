import { InviteFlow } from '../invite-flow'

export const dynamic = 'force-dynamic'

interface InvitePageProps {
  params: Promise<{ token: string }>
}

/** Legacy path: /invite/{token} — still supported for older emailed links. */
export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params
  return <InviteFlow token={token} />
}
