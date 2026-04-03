import { Metadata } from 'next';
import { requireUser } from '@/lib/auth/require-user';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { SearchResultsComponent } from '@/components/search';

export const metadata: Metadata = {
  title: 'Search | FlowForge',
  description: 'Search for projects and tasks',
};

export default async function SearchPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const user = await requireUser()
  const { workspaceId } = await params
  const tenant = await resolveTenantContext(workspaceId, user.id)

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <p className="text-center text-gray-600">You don&apos;t have access to this workspace.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SearchResultsComponent workspaceId={workspaceId} />
    </div>
  )
}
