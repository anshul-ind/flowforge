import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectService } from './service';
import { TenantContext } from '@/lib/tenant/tenant-context';
import { ProjectRepository } from './repository';
import { ProjectPolicy } from './policies';
import { ForbiddenError, NotFoundError } from '@/lib/errors/authorization';

// Mock the dependencies
vi.mock('./repository');
vi.mock('./policies');
vi.mock('@/lib/input/sanitize', () => ({
  sanitizeText: (text: string) => text.trim(),
}));

describe('ProjectService', () => {
  let service: ProjectService;
  let mockTenant: TenantContext;
  let mockRepository: any;

  beforeEach(() => {
    // Setup mock tenant
    mockTenant = {
      workspaceId: 'ws-123',
      userId: 'user-123',
      role: 'OWNER',
    } as TenantContext;

    // Reset mocks
    vi.clearAllMocks();

    // Create service instance
    service = new ProjectService(mockTenant);
    mockRepository = ProjectRepository as any;
  });

  describe('listProjects', () => {
    it('should list projects when user has permission', async () => {
      const mockProjects = [
        { id: 'p1', name: 'Project 1', status: 'IN_PROGRESS' },
        { id: 'p2', name: 'Project 2', status: 'PLANNED' },
      ];

      vi.spyOn(ProjectPolicy, 'canRead').mockReturnValue(true);
      mockRepository.prototype.listProjects.mockResolvedValue(mockProjects);

      const result = await service.listProjects();

      expect(result).toEqual(mockProjects);
      expect(ProjectPolicy.canRead).toHaveBeenCalledWith(mockTenant);
    });

    it('should throw ForbiddenError when user lacks permission', async () => {
      vi.spyOn(ProjectPolicy, 'canRead').mockReturnValue(false);

      await expect(service.listProjects()).rejects.toThrow(ForbiddenError);
    });

    it('should filter projects by status', async () => {
      vi.spyOn(ProjectPolicy, 'canRead').mockReturnValue(true);
      mockRepository.prototype.listProjects.mockResolvedValue([]);

      await service.listProjects({ status: 'IN_PROGRESS' });

      expect(mockRepository.prototype.listProjects).toHaveBeenCalledWith(
        { status: 'IN_PROGRESS' }
      );
    });
  });

  describe('getProject', () => {
    it('should retrieve single project', async () => {
      const mockProject = { id: 'p1', name: 'Project 1' };

      vi.spyOn(ProjectPolicy, 'canRead').mockReturnValue(true);
      mockRepository.prototype.getProject.mockResolvedValue(mockProject);

      const result = await service.getProject('p1');

      expect(result).toEqual(mockProject);
      expect(mockRepository.prototype.getProject).toHaveBeenCalledWith('p1');
    });

    it('should throw NotFoundError when project not found', async () => {
      vi.spyOn(ProjectPolicy, 'canRead').mockReturnValue(true);
      mockRepository.prototype.getProject.mockResolvedValue(null);

      await expect(service.getProject('nonexistent')).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError when user lacks permission', async () => {
      vi.spyOn(ProjectPolicy, 'canRead').mockReturnValue(false);

      await expect(service.getProject('p1')).rejects.toThrow(ForbiddenError);
    });
  });

  describe('createProject', () => {
    it('should create project with sanitized input', async () => {
      const input = { name: '  Test Project  ', description: 'Test Desc' };
      const mockCreated = { id: 'p1', ...input };

      vi.spyOn(ProjectPolicy, 'canCreate').mockReturnValue(true);
      mockRepository.prototype.createProject.mockResolvedValue(mockCreated);

      const result = await service.createProject(input);

      expect(result.name).toBe('Test Project'); // Sanitized
      expect(mockRepository.prototype.createProject).toHaveBeenCalled();
    });

    it('should throw ForbiddenError when user cannot create', async () => {
      vi.spyOn(ProjectPolicy, 'canCreate').mockReturnValue(false);

      await expect(
        service.createProject({ name: 'Project' })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('updateProject', () => {
    it('should update project with authorization check', async () => {
      const input = { name: 'Updated Project' };
      const mockUpdated = { id: 'p1', ...input };

      vi.spyOn(ProjectPolicy, 'canUpdate').mockReturnValue(true);
      mockRepository.prototype.getProject.mockResolvedValue({ id: 'p1' });
      mockRepository.prototype.updateProject.mockResolvedValue(mockUpdated);

      const result = await service.updateProject('p1', input);

      expect(result).toEqual(mockUpdated);
      expect(ProjectPolicy.canUpdate).toHaveBeenCalled();
    });

    it('should throw NotFoundError when project not found', async () => {
      vi.spyOn(ProjectPolicy, 'canUpdate').mockReturnValue(true);
      mockRepository.prototype.getProject.mockResolvedValue(null);

      await expect(
        service.updateProject('nonexistent', { name: 'Updated' })
      ).rejects.toThrow(NotFoundError);
    });
  });
});
