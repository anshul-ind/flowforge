'use client';

import Link from 'next/link';

interface WorkloadData {
  assigneeId: string;
  assigneeName: string;
  assigneeEmail: string;
  openTaskCount: number;
}

interface WorkloadChartProps {
  data: WorkloadData[];
  workspaceId: string;
}

/**
 * Workload Chart
 * Horizontal bar chart showing open tasks per assignee
 */
export function WorkloadChart({ data, workspaceId }: WorkloadChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No workload data available
      </div>
    );
  }

  const maxTasks = Math.max(...data.map(d => d.openTaskCount));

  return (
    <div className="space-y-4">
      {data.map(item => {
        const percentage = (item.openTaskCount / maxTasks) * 100;
        const intensity =
          item.openTaskCount > maxTasks * 0.7
            ? 'bg-red-500' // Heavy load
            : item.openTaskCount > maxTasks * 0.4
              ? 'bg-orange-500' // Medium load
              : 'bg-green-500'; // Light load

        return (
          <Link
            key={item.assigneeId}
            href={`/workspace/${workspaceId}/projects?assignee=${item.assigneeId}`}
            className="group"
          >
            <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              {/* Avatar */}
              <div className="w-10 h-10 bg-linear-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                {item.assigneeName.charAt(0).toUpperCase()}
              </div>

              {/* Name and email */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {item.assigneeName}
                </p>
                <p className="text-xs text-gray-500 truncate">{item.assigneeEmail}</p>
              </div>

              {/* Bar */}
              <div className="flex-1 min-w-0">
                <div className="bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className={`h-full rounded-full flex items-center justify-end pr-2 text-white text-xs font-semibold transition-all ${intensity}`}
                    style={{ width: `${Math.max(percentage, 15)}%` }}
                  >
                    {percentage > 20 && item.openTaskCount}
                  </div>
                </div>
              </div>

              {/* Count */}
              <div className="w-16 text-right shrink-0">
                <p className="font-bold text-gray-900">{item.openTaskCount}</p>
                <p className="text-xs text-gray-500">open</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
