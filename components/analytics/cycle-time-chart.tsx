'use client';

import { useEffect, useRef } from 'react';

interface CycleTimeData {
  projectId: string;
  projectName: string;
  avgCycleTimeDays: number;
  taskCount: number;
}

interface CycleTimeChartProps {
  data: CycleTimeData[];
}

/**
 * Cycle Time Chart
 * Vertical CSS bar chart showing days to completion
 */
export function CycleTimeChart({ data }: CycleTimeChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Animate bars
    const bars = containerRef.current.querySelectorAll('[data-bar]');
    bars.forEach((bar, idx) => {
      setTimeout(() => {
        (bar as HTMLElement).style.animation = 'growUp 0.6s ease-out forwards';
      }, idx * 50);
    });
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No cycle time data available
      </div>
    );
  }

  const maxDays = Math.max(...data.map(d => d.avgCycleTimeDays));

  return (
    <div ref={containerRef} className="space-y-6">
      <style>{`
        @keyframes growUp {
          from {
            height: 0;
            opacity: 0;
          }
          to {
            height: var(--height);
            opacity: 1;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes growUp {
            from { height: var(--height); opacity: 1; }
            to { height: var(--height); opacity: 1; }
          }
        }
      `}</style>

      <div className="flex items-end gap-6 h-80">
        {data.map(item => {
          const heightPercent = (item.avgCycleTimeDays / maxDays) * 100;
          return (
            <div key={item.projectId} className="flex-1 flex flex-col items-center gap-2">
              <div className="flex-1 flex items-end justify-center w-full">
                <div
                  data-bar
                  className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg hover:from-blue-700 hover:to-blue-500 transition-colors group"
                  style={{
                    '--height': `${heightPercent}%`,
                  } as React.CSSProperties}
                >
                  <div className="h-8 flex items-center justify-center text-white font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.avgCycleTimeDays}d
                  </div>
                </div>
              </div>
              <div className="text-center w-full">
                <p className="text-xs font-medium text-gray-700 truncate">
                  {item.projectName}
                </p>
                <p className="text-xs text-gray-500">{item.avgCycleTimeDays} days</p>
                <p className="text-xs text-gray-400">({item.taskCount} tasks)</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Y-Axis label */}
      <div className="text-xs text-gray-500 text-center">
        Days to Complete (Average)
      </div>
    </div>
  );
}
