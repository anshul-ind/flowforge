import { requireUser } from "@/lib/auth/require-user";
import { resolveTenantContext } from "@/lib/tenant/resolve-tenant";
import { WorkspaceService } from "@/modules/workspace/service";
import { ForbiddenError } from "@/lib/errors/authorization";
import { Clock, CheckCircle, TrendingUp, Users } from "lucide-react";

/**
 * Workspace Home Page - PHASE 5
 * 
 * Authenticated user landing page showing:
 * - Greeting banner  
 * - Quick stats (open tasks, completed, projects, team)
 * - Recently worked on section
 * - Due this week section
 * - Design tokens throughout
 */
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
//   const members = [];
// const workspace = { id: workspaceId, name: "Test Workspace" };

  // Mock data for now - in production, fetch from database
  const stats = {
    openTasks: 12,
    completedTasks: 34,
    activeProjects: 5,
    teamMembers: members.length,
  };

  const recentlyWorkedOn = [
    { id: "1", name: "Design System Updates", status: "In Progress" },
    { id: "2", name: "API Integration", status: "In Progress" },
    { id: "3", name: "Mobile Responsive", status: "In Review" },
  ];

  const dueThisWeek = [
    { id: "1", name: "Complete User Onboarding", dueDate: "Apr 3", priority: "high" },
    { id: "2", name: "Review Dashboard Mockups", dueDate: "Apr 4", priority: "medium" },
    { id: "3", name: "Database Migration", dueDate: "Apr 5", priority: "high" },
  ];

  return (
    <div className="space-y-8">
      {/* Greeting Banner */}
      <div 
        className=" border border-border bg-surface p-8 overflow-hidden relative"
        style={{
          background: 'radial-gradient(circle 800px at 50% -50%, var(--color-surface), var(--color-background))'
        }}
      >
        <h1 className="font-display text-2xl font-semibold mb-1 text-white">
          Good morning, {user.name || user.email}
        </h1>
        <p className="text-sm text-secondary text-white">
          You have {stats.openTasks} tasks this week
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Open Tasks */}
        <div className="rounded-xl border border-border bg-surface-raised p-5 shadow-sm border-t-[3px] border-t-info">
          <p className="text-xs uppercase tracking-wider text-muted mb-2">Open Tasks</p>
          <p className="text-2xl font-semibold text-primary">{stats.openTasks}</p>
        </div>

        {/* Completed Tasks */}
        <div className="rounded-xl border border-border bg-surface-raised p-5 shadow-sm border-t-[3px] border-t-success">
          <p className="text-xs uppercase tracking-wider text-muted mb-2">Completed</p>
          <p className="text-2xl font-semibold text-primary">{stats.completedTasks}</p>
        </div>

        {/* Active Projects */}
        <div className="rounded-xl border border-border bg-surface-raised p-5 shadow-sm border-t-[3px] border-t-brand">
          <p className="text-xs uppercase tracking-wider text-muted mb-2">Active Projects</p>
          <p className="text-2xl font-semibold text-primary">{stats.activeProjects}</p>
        </div>

        {/* Team Members */}
        <div className="rounded-xl border border-border bg-surface-raised p-5 shadow-sm border-t-[3px] border-t-warning">
          <p className="text-xs uppercase tracking-wider text-muted mb-2">Team Members</p>
          <p className="text-2xl font-semibold text-primary">{stats.teamMembers}</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recently Worked On - 2 columns */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface-raised p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary">Recently Worked On</h2>
            <a href={`/workspace/${workspaceId}/projects`} className="text-xs text-brand hover:text-brand-hover transition-colors">
              View all →
            </a>
          </div>

          <div className="space-y-2">
            {recentlyWorkedOn.map((item) => (
              <div key={item.id} className="h-10 flex items-center px-2 rounded-md hover:bg-accent transition-colors cursor-pointer">
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">{item.name}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  item.status === 'In Progress' 
                    ? 'bg-brand/10 text-brand' 
                    : 'bg-warning/10 text-warning'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Due This Week - 1 column */}
        <div className="rounded-xl border border-border bg-surface-raised p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Due This Week</h2>

          <div className="space-y-2">
            {dueThisWeek.map((item) => (
              <div key={item.id} className="p-3 rounded-md border border-border hover:bg-accent transition-colors cursor-pointer">
                <p className="font-medium text-text-primary text-xs mb-1">{item.name}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">{item.dueDate}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    item.priority === 'high' 
                      ? 'bg-danger/10 text-danger' 
                      : 'bg-warning/10 text-warning'
                  }`}>
                    {item.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-border bg-surface-raised p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <a href={`/workspace/${workspaceId}/projects`} className="inline-flex items-center px-4 py-2 rounded-md bg-brand text-white hover:bg-brand-hover transition-colors font-medium text-sm">
            + New Project
          </a>
          <a href={`/workspace/${workspaceId}/members`} className="inline-flex items-center px-4 py-2 rounded-md border border-brand text-brand hover:bg-accent transition-colors font-medium text-sm">
            Invite Team
          </a>
          <a href={`/workspace/${workspaceId}/analytics`} className="inline-flex items-center px-4 py-2 rounded-md border border-border text-text-primary hover:bg-accent transition-colors font-medium text-sm">
            View Analytics
          </a>
        </div>
      </div>
    </div>
  );
}