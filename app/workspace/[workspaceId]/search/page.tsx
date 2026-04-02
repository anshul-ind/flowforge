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
  searchParams,
}: {
  params: { workspaceId: string };
  searchParams: { q?: string };
}) {
  // Auth check
  const user = await requireUser();

  // Tenant check
  const tenant = await resolveTenantContext(params.workspaceId, user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <SearchResultsComponent workspaceId={params.workspaceId} />
    </div>
  );
}
