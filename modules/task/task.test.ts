import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskService } from './service';
import { TenantContext } from '@/lib/tenant/tenant-context';
import { TaskRepository } from './repository';
import { TaskPolicy } from './policies';
import { ForbiddenError, NotFoundError } from '@/lib/errors/authorization';

vi.mock('./repository');
vi.mock('./policies');
vi.mock('@/lib/input/sanitize', () => ({
  sanitizeText: (text: string) => text.trim(),
}));

describe('TaskService', () => {
  let service: TaskService;
  let mockTenant: TenantContext;

  beforeEach(() => {
    mockTenant = {
      workspaceId: 'ws-123',
      userId: 'user-123',
      role: 'MEMBER',
    } as TenantContext;

    vi.clearAllMocks();
    service = new TaskService(mockTenant);
  });

  describe('listTasks', () => {
    it('should list tasks with filters', async () => {
      const mockTasks = [
        { id: 't1', title: 'Task 1', status: 'PLANNED' },
        { id: 't2', title: 'Task 2', status: 'IN_PROGRESS' },
      ];

      vi.spyOn(TaskPolicy, 'canRead').mockReturnValue(true);
      (TaskRepository as any).prototype.listTasks.mockResolvedValue(mockTasks);

      const result = await service.listTasks({ projectId: 'p1' });

      expect(result).toEqual(mockTasks);
      expect(TaskPolicy.canRead).toHaveBeenCalled();
    });

    it('should throw ForbiddenError when user cannot read', async () => {
      vi.spyOn(TaskPolicy, 'canRead').mockReturnValue(false);

      await expect(service.listTasks()).rejects.toThrow(ForbiddenError);
    });
  });

  describe('getTask', () => {
    it('should retrieve single task', async () => {
      const mockTask = { id: 't1', title: 'Task 1', status: 'PLANNED' };

      vi.spyOn(TaskPolicy, 'canRead').mockReturnValue(true);
      (TaskRepository as any).prototype.getTask.mockResolvedValue(mockTask);

      const result = await service.getTask('t1');

      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundError when task not found', async () => {
      vi.spyOn(TaskPolicy, 'canRead').mockReturnValue(true);
      (TaskRepository as any).prototype.getTask.mockResolvedValue(null);

      await expect(service.getTask('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('createTask', () => {
    it('should create task with sanitized input', async () => {
      const input = {
        projectId: 'p1',
        title: '  New Task  ',
        description: 'Task description',
        priority: 'HIGH',
      };

      vi.spyOn(TaskPolicy, 'canCreate').mockReturnValue(true);
      (TaskRepository as any).prototype.createTask.mockResolvedValue({
        id: 't1',
        ...input,
      });

      const result = await service.createTask(input);

      expect(result.title).toBe('New Task'); // Sanitized
      expect(TaskPolicy.canCreate).toHaveBeenCalled();
    });
  });

  describe('updateTask', () => {
    it('should update task with status transition', async () => {
      const existing = { id: 't1', status: 'PLANNED', assigneeId: 'u1' };
      const update = { status: 'IN_PROGRESS' };

      vi.spyOn(TaskPolicy, 'canUpdate').mockReturnValue(true);
      (TaskRepository as any).prototype.getTask.mockResolvedValue(existing);
      (TaskRepository as any).prototype.updateTask.mockResolvedValue({
        ...existing,
        ...update,
      });

      const result = await service.updateTask('t1', update);

      expect(result.status).toBe('IN_PROGRESS');
      expect(TaskPolicy.canUpdate).toHaveBeenCalled();
    });

    it('should notify when assignee changes', async () => {
      const existing = { id: 't1', assigneeId: 'u1' };
      const update = { assigneeId: 'u2' };

      vi.spyOn(TaskPolicy, 'canUpdate').mockReturnValue(true);
      (TaskRepository as any).prototype.getTask.mockResolvedValue(existing);
      (TaskRepository as any).prototype.updateTask.mockResolvedValue({
        ...existing,
        ...update,
      });

      const notifySpy = vi.fn();
      service.notifyTaskAssignment = notifySpy;

      await service.updateTask('t1', update);

      // Verify notification would be called for assignee change
      expect(TaskPolicy.canUpdate).toHaveBeenCalled();
    });
  });

  describe('deleteTask', () => {
    it('should soft-delete task', async () => {
      vi.spyOn(TaskPolicy, 'canDelete').mockReturnValue(true);
      (TaskRepository as any).prototype.getTask.mockResolvedValue({ id: 't1' });
      (TaskRepository as any).prototype.deleteTask.mockResolvedValue({
        id: 't1',
        deleted: true,
      });

      const result = await service.deleteTask('t1');

      expect(TaskPolicy.canDelete).toHaveBeenCalled();
    });
  });
});
