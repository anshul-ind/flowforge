import { TenantContext } from '@/lib/tenant/tenant-context';
import { ForbiddenError, NotFoundError } from '@/lib/errors/authorization';
import { ExportRepository } from './repository';
import { convertTasksToCSV, convertTasksToDetailedCSV, type TaskExportData } from '@/lib/utils/csv';

/**
 * Export Service
 * 
 * Handles data export operations with authorization checks.
 */
export class ExportService {
  private repo: ExportRepository;

  constructor(private tenant: TenantContext) {
    this.repo = new ExportRepository(tenant);
  }

  /**
   * Export all tasks in a project to CSV format
   * Format: One row per task, comments embedded
   */
  async exportProjectTasksToCSV(projectId: string): Promise<string> {
    if (!this.canExport()) {
      throw new ForbiddenError('Cannot export tasks');
    }

    const tasks = await this.repo.getProjectTasksForExport(projectId);
    if (tasks.length === 0) {
      throw new NotFoundError('No tasks found in project');
    }

    return convertTasksToCSV(tasks);
  }

  /**
   * Export all tasks with detailed comments format
   * Format: Multiple rows per task (one row per comment)
   */
  async exportProjectTasksToDetailedCSV(projectId: string): Promise<string> {
    if (!this.canExport()) {
      throw new ForbiddenError('Cannot export tasks');
    }

    const tasks = await this.repo.getProjectTasksForExport(projectId);
    if (tasks.length === 0) {
      throw new NotFoundError('No tasks found in project');
    }

    return convertTasksToDetailedCSV(tasks);
  }

  /**
   * Get raw task data for export (for API consumers)
   */
  async getProjectTasksForExport(projectId: string): Promise<TaskExportData[]> {
    if (!this.canExport()) {
      throw new ForbiddenError('Cannot export tasks');
    }

    const tasks = await this.repo.getProjectTasksForExport(projectId);
    if (tasks.length === 0) {
      throw new NotFoundError('No tasks found in project');
    }

    return tasks;
  }

  /**
   * Check if user can export data
   * For now: same as read permission (OWNER, MANAGER, MEMBER, VIEWER)
   */
  private canExport(): boolean {
    // All workspace members can export data
    return this.tenant.workspaceId !== null;
  }
}
