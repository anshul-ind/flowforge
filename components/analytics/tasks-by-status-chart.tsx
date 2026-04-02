'use client';

import { useEffect, useRef } from 'react';

interface TasksStatusData {
  status: string;
  count: number;
}

interface TasksByStatusChartProps {
  data: TasksStatusData[];
}

const statusColors: Record<string, string> = {
  OPEN: '#3b82f6', // blue
  IN_PROGRESS: '#a855f7', // purple
  REVIEW: '#f59e0b', // amber
  DONE: '#10b981', // green
};

/**
 * Tasks By Status Chart
 * CSS bar chart with animation
 */
export function TasksByStatusChart({ data }: TasksByStatusChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Animate bars on mount
    const bars = containerRef.current.querySelectorAll('[data-bar]');
    bars.forEach((bar, idx) => {
      setTimeout(() => {
        (bar as HTMLElement).style.animation = 'slideIn 0.6s ease-out forwards';
      }, idx * 50);
    });
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No task data available
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <div ref={containerRef} className="space-y-4">
      <style>{`
        @keyframes slideIn {
          from {
            width: 0;
            opacity: 0;
          }
          to {
            width: var(--width);
            opacity: 1;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes slideIn {
            from { width: var(--width); opacity: 1; }
            to { width: var(--width); opacity: 1; }
          }
        }
      `}</style>

      {data.map(item => {
        const percentage = (item.count / maxCount) * 100;
        const color = statusColors[item.status] || '#6b7280';

        return (
          <div key={item.status} className="flex items-center gap-4">
            <div className="w-32">
              <p className="font-medium text-sm text-gray-700">{item.status}</p>
            </div>
            <div className="flex-1">
              <div className="bg-gray-100 rounded-full h-8 overflow-hidden">
                <div
                  data-bar
                  className="h-full rounded-full flex items-center justify-end pr-3 text-white text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: color,
                    '--width': `${percentage}%`,
                  } as React.CSSProperties}
                >
                  {percentage > 10 && item.count}
                </div>
              </div>
            </div>
            <div className="w-16 text-right">
              <p className="font-semibold text-gray-900">{item.count}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
