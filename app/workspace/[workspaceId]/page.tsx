import { requireUser } from "@/lib/auth/require-user";
import { resolveTenantContext } from "@/lib/tenant/resolve-tenant";
import { WorkspaceService } from "@/modules/workspace/service";
import { ForbiddenError } from "@/lib/errors/authorization";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { WorkspaceStats } from "@/components/workspace/workspace-stats";
import { MemberList } from "@/components/workspace/member-list";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const user = await requireUser();

  const tenant = await resolveTenantContext(workspaceId, user.id);

  if (!tenant) {
    throw new ForbiddenError("Workspace access denied");
  }

  const service = new WorkspaceService(tenant);
  const workspace = await service.getWorkspace();
  const members = await service.getMembers();

  const projectCount = 0;

  return (
    <div className="space-y-6">
      <WorkspaceHeader workspace={workspace} memberCount={members.length} />
      <WorkspaceStats memberCount={members.length} projectCount={projectCount} />

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Members</h2>
        </div>
        <MemberList 
          workspaceId={workspaceId}
          members={members}
          currentUserRole={tenant.role}
        />
      </div>
    </div>
  );
}