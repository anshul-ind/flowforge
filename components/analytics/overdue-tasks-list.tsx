'use client';

import Link from 'next/link';

interface OverdueTask {
  id: string;
  title: string;
  dueDate: Date;
  status: string;
  project: { id: string; name: string };
  assignee?: { id: string; name: string | null; email: string } | null;
}

interface OverdueTasksListProps {
  tasks: OverdueTask[];
  workspaceId: string;
  page?: number;
  pageSize?: number;
  total?: number;
  hasMore?: boolean;
}

/**
 * Overdue Tasks List
 * Paginated table showing overdue tasks sorted by due date
 */
export function OverdueTasksList({
  tasks,
  workspaceId,
  page = 1,
  pageSize = 10,
  total = 0,
  hasMore = false,
}: OverdueTasksListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="font-medium">No overdue tasks 🎉</p>
        <p className="text-sm">All tasks are on track!</p>
      </div>
    );
  }

  const getDaysOverdue = (dueDate: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(dueDate).getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: 'bg-blue-50 text-blue-700',
      IN_PROGRESS: 'bg-purple-50 text-purple-700',
      REVIEW: 'bg-amber-50 text-amber-700',
      DONE: 'bg-green-50 text-green-700',
    };
    return colors[status] || 'bg-gray-50 text-gray-700';
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Project</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Assignee</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Due Date</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Days Overdue</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => {
              const daysOverdue = getDaysOverdue(task.dueDate);
              return (
                <tr
                  key={task.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <Link
                      href={`/workspace/${workspaceId}/projects/${task.project.id}/tasks/${task.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium truncate"
                    >
                      {task.title}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{task.project.name}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {task.assignee?.name || 'Unassigned'}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-bold text-red-600">{daysOverdue}d</span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        task.status
                      )}`}
                    >
                      {task.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(pageSize < total || hasMore) && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of{' '}
            {total} overdue tasks
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled={!hasMore}
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
