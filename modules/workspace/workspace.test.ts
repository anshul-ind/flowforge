import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkspaceService } from './service';
import { TenantContext } from '@/lib/tenant/tenant-context';
import { WorkspaceRepository } from './repository';
import { WorkspacePolicy } from './policies';
import { ForbiddenError, NotFoundError } from '@/lib/errors/authorization';

vi.mock('./repository');
vi.mock('./policies');
vi.mock('@/lib/input/sanitize', () => ({
  sanitizeText: (text: string) => text.trim(),
}));

describe('WorkspaceService', () => {
  let service: WorkspaceService;
  let mockTenant: TenantContext;

  beforeEach(() => {
    mockTenant = {
      workspaceId: 'ws-123',
      userId: 'user-123',
      role: 'OWNER',
    } as TenantContext;

    vi.clearAllMocks();
    service = new WorkspaceService(mockTenant);
  });

  describe('listWorkspaces', () => {
    it('should list workspaces for user', async () => {
      const mockWorkspaces = [
        { id: 'ws1', name: 'Workspace 1' },
        { id: 'ws2', name: 'Workspace 2' },
      ];

      (WorkspaceRepository as any).prototype.listWorkspaces.mockResolvedValue(
        mockWorkspaces
      );

      const result = await service.listWorkspaces();

      expect(result).toEqual(mockWorkspaces);
    });
  });

  describe('getWorkspace', () => {
    it('should retrieve workspace by ID', async () => {
      const mockWorkspace = { id: 'ws-123', name: 'My Workspace' };

      vi.spyOn(WorkspacePolicy, 'canRead').mockReturnValue(true);
      (WorkspaceRepository as any).prototype.getWorkspace.mockResolvedValue(
        mockWorkspace
      );

      const result = await service.getWorkspace('ws-123');

      expect(result).toEqual(mockWorkspace);
    });

    it('should throw NotFoundError when workspace not found', async () => {
      vi.spyOn(WorkspacePolicy, 'canRead').mockReturnValue(true);
      (WorkspaceRepository as any).prototype.getWorkspace.mockResolvedValue(
        null
      );

      await expect(service.getWorkspace('nonexistent')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('createWorkspace', () => {
    it('should create workspace with sanitized name', async () => {
      const input = {
        name: '  My New Workspace  ',
        description: 'Test workspace',
      };

      (WorkspaceRepository as any).prototype.createWorkspace.mockResolvedValue({
        id: 'ws-new',
        ...input,
        ownerId: mockTenant.userId,
      });

      const result = await service.createWorkspace(input);

      expect(result.name).toBe('My New Workspace'); // Sanitized
    });
  });

  describe('updateWorkspace', () => {
    it('should update workspace with authorization', async () => {
      const update = { name: '  Updated Workspace  ' };

      vi.spyOn(WorkspacePolicy, 'canUpdate').mockReturnValue(true);
      (WorkspaceRepository as any).prototype.getWorkspace.mockResolvedValue({
        id: 'ws-123',
      });
      (WorkspaceRepository as any).prototype.updateWorkspace.mockResolvedValue({
        id: 'ws-123',
        ...update,
      });

      const result = await service.updateWorkspace('ws-123', update);

      expect(result.name).toBe('Updated Workspace');
      expect(WorkspacePolicy.canUpdate).toHaveBeenCalled();
    });

    it('should throw ForbiddenError when user cannot update', async () => {
      vi.spyOn(WorkspacePolicy, 'canUpdate').mockReturnValue(false);

      await expect(
        service.updateWorkspace('ws-123', { name: 'Hacked' })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('inviteMember', () => {
    it('should invite user to workspace', async () => {
      const input = { email: 'user@example.com', role: 'MEMBER' };

      vi.spyOn(WorkspacePolicy, 'canInvite').mockReturnValue(true);
      (WorkspaceRepository as any).prototype.inviteMember.mockResolvedValue({
        id: 'inv-1',
        ...input,
        workspaceId: 'ws-123',
      });

      const result = await service.inviteMember(input);

      expect(result.email).toBe('user@example.com');
      expect(WorkspacePolicy.canInvite).toHaveBeenCalled();
    });

    it('should throw ForbiddenError when user cannot invite', async () => {
      vi.spyOn(WorkspacePolicy, 'canInvite').mockReturnValue(false);

      await expect(
        service.inviteMember({ email: 'user@example.com', role: 'MEMBER' })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('removeMember', () => {
    it('should remove member with authorization', async () => {
      vi.spyOn(WorkspacePolicy, 'canRemoveMember').mockReturnValue(true);
      (WorkspaceRepository as any).prototype.removeMember.mockResolvedValue({
        id: 'user-to-remove',
        removed: true,
      });

      const result = await service.removeMember('user-to-remove');

      expect(WorkspacePolicy.canRemoveMember).toHaveBeenCalled();
    });
  });
});
