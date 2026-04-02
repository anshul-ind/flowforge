import { TenantContext } from '@/lib/tenant/tenant-context';
import { prisma } from '@/lib/db';
import type { TaskExportData } from '@/lib/utils/csv';

/**
 * Export Repository
 * 
 * Data access layer for export operations.
 * Enforces workspace and project boundaries.
 */
export class ExportRepository {
  constructor(private tenant: TenantContext) {}

  /**
   * Get all tasks in a project with complete data for export
   * Includes: comments, reactions, mentions
   */
  async getProjectTasksForExport(projectId: string): Promise<TaskExportData[]> {
    // Verify project belongs to workspace
    const project = await prisma.project.findFirst({
      where: { id: projectId, workspaceId: this.tenant.workspaceId },
      select: { id: true, name: true },
    });

    if (!project) {
      return [];
    }

    // Get tasks with all relations
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        workspaceId: this.tenant.workspaceId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        assignee: {
          select: {
            name: true,
            email: true,
          },
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            editedAt: true,
            deletedAt: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            reactions: {
              select: {
                emoji: true,
              },
            },
            mentions: {
              select: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Transform data for export
    return tasks.map((task) => {
      // Group reactions by emoji and count users
      const reactionMap = new Map<string, Set<string>>();
      task.comments.forEach((comment) => {
        comment.reactions.forEach((reaction) => {
          if (!reactionMap.has(reaction.emoji)) {
            reactionMap.set(reaction.emoji, new Set());
          }
        });
      });

      return {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        assignee: task.assignee
          ? `${task.assignee.name || 'Unknown'} (${task.assignee.email})`
          : null,
        projectName: project.name,
        commentCount: task.comments.length,
        comments: task.comments.map((comment) => {
          // Group reactions by emoji and count
          const commentReactionMap = new Map<string, number>();
          comment.reactions.forEach((reaction) => {
            commentReactionMap.set(
              reaction.emoji,
              (commentReactionMap.get(reaction.emoji) || 0) + 1
            );
          });

          return {
            id: comment.id,
            content: comment.content,
            author: `${comment.user.name || 'Unknown'} (${comment.user.email})`,
            createdAt: comment.createdAt.toISOString(),
            editedAt: comment.editedAt ? comment.editedAt.toISOString() : null,
            deletedAt: comment.deletedAt ? comment.deletedAt.toISOString() : null,
            reactions: Array.from(commentReactionMap).map(([emoji, count]) => ({
              emoji,
              userCount: count,
            })),
            mentions: comment.mentions.map(
              (mention) =>
                `${mention.user.name || 'Unknown'} (${mention.user.email})`
            ),
          };
        }),
      };
    });
  }
}
