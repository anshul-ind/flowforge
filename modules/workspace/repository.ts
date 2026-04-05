import { TenantContext } from '@/lib/tenant/tenant-context';
import { prisma } from '@/lib/db';
import { Workspace, WorkspaceMember, WorkspaceRole } from '@/lib/generated/prisma';

/**
 * Workspace Repository
 * 
 * Data access layer for workspace operations.
 * Enforces workspace scoping in all queries.
 * 
 * Note: Some methods are static (don't require TenantContext)
 * because they operate at the workspace level (create, findBySlug, findUserWorkspaces).
 * Most instance methods are scoped to this.tenant.workspaceId.
 */
export class WorkspaceRepository {
  constructor(private tenant: TenantContext) {}

  /**
   * Get workspace by ID
   * Scoped to tenant's workspace
   */
  async getWorkspace(): Promise<Workspace | null> {
    return await prisma.workspace.findUnique({
      where: {
        id: this.tenant.workspaceId,
      },
    });
  }

  /**
   * Update workspace details
   * Only name and slug can be updated
   */
  async updateWorkspace(data: {
    name?: string;
    slug?: string;
  }): Promise<Workspace> {
    return await prisma.workspace.update({
      where: {
        id: this.tenant.workspaceId,
      },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.slug && { slug: data.slug }),
      },
    });
  }

  /**
   * Delete workspace
   * Soft delete by doing a cascading delete
   */
  async deleteWorkspace(): Promise<void> {
    // In production, consider soft delete (add deletedAt field)
    // For now, just prevent deletion if workspace has child records
    await prisma.workspace.delete({
      where: {
        id: this.tenant.workspaceId,
      },
    });
  }

  /**
   * Get workspace with members
   */
  async getWorkspaceWithMembers(): Promise<(Workspace & { members: (WorkspaceMember & { user: { email: string; name: string | null } })[] }) | null> {
    return await prisma.workspace.findUnique({
      where: {
        id: this.tenant.workspaceId,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get workspace member count
   */
  async getMemberCount(): Promise<number> {
    return await prisma.workspaceMember.count({
      where: {
        workspaceId: this.tenant.workspaceId,
      },
    });
  }

  /**
   * Add member to workspace
   */
  async addMember(userId: string, role: WorkspaceRole = 'MEMBER'): Promise<WorkspaceMember> {
    return await prisma.workspaceMember.create({
      data: {
        userId,
        workspaceId: this.tenant.workspaceId,
        role,
      },
    });
  }

  /**
   * Update member role
   */
  async updateMemberRole(memberId: string, role: WorkspaceRole): Promise<WorkspaceMember> {
    return await prisma.workspaceMember.update({
      where: {
        id: memberId,
        workspaceId: this.tenant.workspaceId,
      },
      data: { role },
    });
  }

  /**
   * Remove member from workspace
   */
  async removeMember(memberId: string): Promise<void> {
    await prisma.workspaceMember.delete({
      where: {
        id: memberId,
        workspaceId: this.tenant.workspaceId,
      },
    });
  }

  /**
   * Check if user is already a member
   */
  async isMember(userId: string): Promise<boolean> {
    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: this.tenant.workspaceId,
        },
      },
    });
    return !!member;
  }

  // ============================================
  // Static methods (not scoped to tenant)
  // ============================================

  /**
   * Create a new workspace
   * Creator is automatically added as OWNER
   */
  static async create(name: string, slug: string, creatorId: string): Promise<Workspace> {
    const orgSlug = `org-${slug}`

    const workspace = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name,
          slug: orgSlug,
          createdById: creatorId,
        },
      })

      const ws = await tx.workspace.create({
        data: {
          name,
          slug,
          createdById: creatorId,
          organizationId: org.id,
        },
      })

      await tx.workspaceMember.create({
        data: {
          userId: creatorId,
          workspaceId: ws.id,
          role: 'OWNER',
          status: 'ACTIVE',
        },
      })

      await tx.organizationMember.create({
        data: {
          userId: creatorId,
          organizationId: org.id,
          role: 'ORG_ADMIN',
          status: 'ACTIVE',
        },
      })

      return ws
    })

    return workspace
  }

  /**
   * Find workspace by slug
   * Used for workspace discovery and slug uniqueness checks
   */
  static async findBySlug(slug: string): Promise<Workspace | null> {
    return await prisma.workspace.findUnique({
      where: { slug },
    });
  }

  /**
   * Find all workspaces for a user
   * Returns all workspaces user is a member of
   */
  static async findUserWorkspaces(
    userId: string
  ): Promise<(Workspace & { role: WorkspaceRole })[]> {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: true,
      },
    });

    return memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
    }));
  }
}
