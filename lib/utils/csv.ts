/**
 * CSV conversion utilities for task export
 */

// Type definitions for CSV export
export type TaskExportData = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority?: string;
  dueDate: string | null;
  assignee: string | null;
  createdAt: string;
  updatedAt: string;
  projectName?: string;
  commentCount?: number;
  comments: Array<{
    id: string;
    author: string;
    content: string;
    createdAt: string;
    editedAt: string | null;
    deletedAt: string | null;
    reactions: Array<{ emoji: string; userCount: number }>;
    mentions: string[];
  }>;
};

function escapeCSVField(field: string | null | undefined): string {
  if (field === null || field === undefined) {
    return '';
  }

  const fieldStr = String(field);

  // If field contains comma, newline, or double quote, wrap in quotes and escape quotes
  if (fieldStr.includes(',') || fieldStr.includes('\n') || fieldStr.includes('"')) {
    return `"${fieldStr.replace(/"/g, '""')}"`;
  }

  return fieldStr;
}

/**
 * Convert comments to a formatted string for CSV export
 */
function formatCommentsForCSV(
  comments: TaskExportData['comments']
): string {
  if (comments.length === 0) {
    return '';
  }

  return comments
    .map((comment: TaskExportData['comments'][0]) => {
      let commentStr = `[${comment.createdAt}] ${comment.author}: ${comment.content}`;

      if (comment.reactions.length > 0) {
        const reactionStr = comment.reactions
          .map((r: typeof comment.reactions[0]) => `${r.emoji} (${r.userCount})`)
          .join(', ');
        commentStr += ` | Reactions: ${reactionStr}`;
      }

      if (comment.mentions.length > 0) {
        commentStr += ` | Mentions: ${comment.mentions.join(', ')}`;
      }

      if (comment.editedAt) {
        commentStr += ` [Edited: ${comment.editedAt}]`;
      }

      if (comment.deletedAt) {
        commentStr += ` [Deleted: ${comment.deletedAt}]`;
      }

      return commentStr;
    })
    .join('\n');
}

/**
 * Convert task export data to CSV format
 */
export function convertTasksToCSV(tasks: TaskExportData[]): string {
  // CSV Header
  const headers = [
    'Task ID',
    'Title',
    'Description',
    'Status',
    'Priority',
    'Due Date',
    'Created At',
    'Updated At',
    'Assignee',
    'Project',
    'Comment Count',
    'Comments',
  ];

  const rows: string[] = [headers.map(escapeCSVField).join(',')];

  // CSV Data Rows
  tasks.forEach((task) => {
    const row = [
      escapeCSVField(task.id),
      escapeCSVField(task.title),
      escapeCSVField(task.description),
      escapeCSVField(task.status),
      escapeCSVField(task.priority),
      escapeCSVField(task.dueDate),
      escapeCSVField(task.createdAt),
      escapeCSVField(task.updatedAt),
      escapeCSVField(task.assignee),
      escapeCSVField(task.projectName),
      escapeCSVField(String(task.commentCount)),
      escapeCSVField(formatCommentsForCSV(task.comments)),
    ];

    rows.push(row.join(','));
  });

  return rows.join('\n');
}

/**
 * Convert to CSV with detailed comments on separate rows
 * This creates multiple rows per task when it has comments
 */
export function convertTasksToDetailedCSV(tasks: TaskExportData[]): string {
  const headers = [
    'Task ID',
    'Title',
    'Description',
    'Status',
    'Priority',
    'Due Date',
    'Created At',
    'Updated At',
    'Assignee',
    'Project',
    'Comment ID',
    'Comment Author',
    'Comment Content',
    'Comment Created At',
    'Comment Reactions',
    'Comment Mentions',
  ];

  const rows: string[] = [headers.map(escapeCSVField).join(',')];

  // For each task, create rows for task + each comment
  tasks.forEach((task) => {
    if (task.comments.length === 0) {
      // Task with no comments - single row
      const row = [
        escapeCSVField(task.id),
        escapeCSVField(task.title),
        escapeCSVField(task.description),
        escapeCSVField(task.status),
        escapeCSVField(task.priority),
        escapeCSVField(task.dueDate),
        escapeCSVField(task.createdAt),
        escapeCSVField(task.updatedAt),
        escapeCSVField(task.assignee),
        escapeCSVField(task.projectName),
        '', // Comment ID
        '', // Comment Author
        '', // Comment Content
        '', // Comment Created At
        '', // Comment Reactions
        '', // Comment Mentions
      ];
      rows.push(row.join(','));
    } else {
      // Task with comments - one row per comment
      task.comments.forEach((comment) => {
        const reactionStr = comment.reactions
          .map((r) => `${r.emoji}(${r.userCount})`)
          .join(', ');
        const mentionStr = comment.mentions.join(', ');

        const row = [
          escapeCSVField(task.id),
          escapeCSVField(task.title),
          escapeCSVField(task.description),
          escapeCSVField(task.status),
          escapeCSVField(task.priority),
          escapeCSVField(task.dueDate),
          escapeCSVField(task.createdAt),
          escapeCSVField(task.updatedAt),
          escapeCSVField(task.assignee),
          escapeCSVField(task.projectName),
          escapeCSVField(comment.id),
          escapeCSVField(comment.author),
          escapeCSVField(comment.content),
          escapeCSVField(comment.createdAt),
          escapeCSVField(reactionStr),
          escapeCSVField(mentionStr),
        ];
        rows.push(row.join(','));
      });
    }
  });

  return rows.join('\n');
}
