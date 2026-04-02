import { requireUser } from '@/lib/auth/require-user';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { WorkspaceService } from '@/modules/workspace/service';
import { ForbiddenError } from '@/lib/errors';
import { MemberList } from '@/components/workspace/member-list';

/**
 * Workspace Members Page
 * 
 * Dedicated view for workspace members with invite functionality
 */
export default async function MembersPage({
  params,
}: {
  params: Readonly<Promise<{ workspaceId: string }>>;
}) {
  const { workspaceId } = await params;
  const user = await requireUser();

  // Resolve tenant context
  const tenant = await resolveTenantContext(workspaceId, user.id);

  if (!tenant) {
    throw new ForbiddenError('Workspace access denied');
  }

  // Fetch members
  const service = new WorkspaceService(tenant);
  const members = await service.getMembers();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Members</h1>
        <p className="text-gray-500 mt-1">
          {members.length} member{members.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Members list */}
      <div className="bg-white rounded-lg border border-gray-200">
        <MemberList 
          workspaceId={workspaceId}
          members={members}
          currentUserRole={tenant.role}
        />
      </div>
    </div>
  );
}
