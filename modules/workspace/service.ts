import { TenantContext } from '@/lib/tenant/tenant-context';
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { sanitizeText } from '@/lib/input/sanitize';
import { WorkspacePolicy } from './policies';
import { WorkspaceRepository } from './repository';
import { Workspace, WorkspaceRole, WorkspaceMember } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';

/**
 * Workspace Service
 * 
 * Business logic layer for workspace operations.
 * 
 * Pattern:
 * 1. Check authorization using policies
 * 2. If denied, throw ForbiddenError
 * 3. Validate business rules (throw ValidationError)
 * 4. Use repository for data access
 * 5. Throw NotFoundError if resource doesn't exist
 * 
 * Benefits:
 * - Authorization happens before data access
 * - Clear separation of concerns
 * - Easy to understand flow
 * - Reusable across different interfaces (API, actions, etc.)
 */
export class WorkspaceService {
  private repo: WorkspaceRepository;

  constructor(private tenant: TenantContext) {
    this.repo = new WorkspaceRepository(tenant);
  }

  /**
   * Get current workspace details
   * All members can read their workspace
   */
  async getWorkspace(): Promise<Workspace> {
    if (!WorkspacePolicy.canRead(this.tenant)) {
      throw new ForbiddenError('Cannot read workspace');
    }

    const workspace = await this.repo.getWorkspace();
    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

    return workspace;
  }

  /**
   * Update workspace settings
   * Only OWNER and MANAGER roles
   */
  async updateWorkspace(data: {
    name?: string;
    slug?: string;
  }): Promise<Workspace> {
    if (!WorkspacePolicy.canUpdate(this.tenant)) {
      throw new ForbiddenError('Cannot update workspace settings');
    }

    // If updating slug, check uniqueness
    if (data.slug) {
      const existing = await WorkspaceRepository.findBySlug(data.slug);
      if (existing && existing.id !== this.tenant.workspaceId) {
        throw new ValidationError('This slug is already taken');
      }
    }

    // Sanitize input
    const sanitizedData = {
      name: data.name ? sanitizeText(data.name) : undefined,
      slug: data.slug,
    };

    return await this.repo.updateWorkspace(sanitizedData);
  }

  /**
   * Delete workspace
   * Only OWNER role
   * 
   * Note: Requires confirmation via server action
   */
  async deleteWorkspace(): Promise<void> {
    if (!WorkspacePolicy.canDelete(this.tenant)) {
      throw new ForbiddenError('Cannot delete workspace');
    }

    const workspace = await this.repo.getWorkspace();
    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

    // Delete workspace (cascades to members, projects, tasks, etc.)
    await this.repo.deleteWorkspace();
  }

  /**
   * Get all workspace members with user details
   */
  async getMembers(): Promise<(WorkspaceMember & { user: { email: string; name: string | null } })[]> {
    if (!WorkspacePolicy.canRead(this.tenant)) {
      throw new ForbiddenError('Cannot read workspace members');
    }

    const workspace = await this.repo.getWorkspaceWithMembers();
    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

    return workspace.members;
  }

  /**
   * Invite member to workspace
   * Only OWNER and MANAGER roles
   * 
   * Flow:
   * 1. Check permission
   * 2. Find user by email
   * 3. Check if already a member
   * 4. Add to workspace with role
   */
  async inviteMember(email: string, role: WorkspaceRole = 'MEMBER'): Promise<WorkspaceMember> {
    if (!WorkspacePolicy.canInviteMember(this.tenant)) {
      throw new ForbiddenError('Cannot invite members to this workspace');
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError('User with this email does not exist');
    }

    // Check if already a member
    const isMember = await this.repo.isMember(user.id);
    if (isMember) {
      throw new ValidationError('This user is already a member of this workspace');
    }

    // Add member
    return await this.repo.addMember(user.id, role);
  }

  /**
   * Update member role
   * Only OWNER can change roles
   */
  async updateMemberRole(memberId: string, newRole: WorkspaceRole): Promise<WorkspaceMember> {
    if (!WorkspacePolicy.canManageRoles(this.tenant)) {
      throw new ForbiddenError('Cannot manage member roles');
    }

    // Get the member
    const member = await prisma.workspaceMember.findUnique({
      where: {
        id: memberId,
        workspaceId: this.tenant.workspaceId,
      },
    });

    if (!member) {
      throw new NotFoundError('Member not found in this workspace');
    }

    // Prevent non-OWNER from changing OWNER role
    if (member.role === 'OWNER' && this.tenant.role !== 'OWNER') {
      throw new ForbiddenError('Only workspace owners can change owner roles');
    }

    // Prevent non-OWNER from creating new OWNER
    if (newRole === 'OWNER' && this.tenant.role !== 'OWNER') {
      throw new ForbiddenError('Only workspace owners can create new owners');
    }

    return await this.repo.updateMemberRole(memberId, newRole);
  }

  /**
   * Remove member from workspace
   * OWNER and MANAGER can remove members
   */
  async removeMember(memberId: string): Promise<void> {
    if (!WorkspacePolicy.canRemoveMember(this.tenant)) {
      throw new ForbiddenError('Cannot remove members');
    }

    // Get the member
    const member = await prisma.workspaceMember.findUnique({
      where: {
        id: memberId,
        workspaceId: this.tenant.workspaceId,
      },
    });

    if (!member) {
      throw new NotFoundError('Member not found in this workspace');
    }

    // Prevent non-OWNER from removing OWNER
    if (member.role === 'OWNER' && this.tenant.role !== 'OWNER') {
      throw new ForbiddenError('Only workspace owners can remove owners');
    }

    // Prevent removing the last OWNER
    const ownerCount = await prisma.workspaceMember.count({
      where: {
        workspaceId: this.tenant.workspaceId,
        role: 'OWNER',
      },
    });

    if (member.role === 'OWNER' && ownerCount === 1) {
      throw new ValidationError('Cannot remove the last owner of the workspace');
    }

    await this.repo.removeMember(memberId);
  }
}

/**
 * Static factory method for creating a new workspace
 * Does NOT require TenantContext (called during signup/workspace creation)
 * 
 * Flow:
 * 1. Validate name
 * 2. Generate slug from name
 * 3. Check slug uniqueness
 * 4. Create workspace with creator as OWNER
 */
export async function createWorkspaceService(
  name: string,
  slug: string,
  creatorId: string
): Promise<Workspace> {
  // Check slug uniqueness
  const existing = await WorkspaceRepository.findBySlug(slug);
  if (existing) {
    throw new ValidationError('This workspace slug is already taken');
  }

  // Create workspace
  return await WorkspaceRepository.create(name, slug, creatorId);
}
