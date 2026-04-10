import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/require-user';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { isScopedInviteMember } from '@/lib/tenant/invite-restriction';
import { WorkspaceService } from '@/modules/workspace/service';
import { ForbiddenError } from '@/lib/errors';
import { canInvite } from '@/lib/permissions';
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

  if (isScopedInviteMember(tenant)) {
    notFound();
  }

  // Fetch members
  const service = new WorkspaceService(tenant);
  const members = await service.getMembers();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Members</h1>
          <p className="text-gray-500 mt-1">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canInvite(tenant.role) && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/workspace/${workspaceId}/invitations`}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Pending invitations
            </Link>
            <Link
              href={`/workspace/${workspaceId}/members/invite`}
              className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900"
            >
              Invite people
            </Link>
          </div>
        )}
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
