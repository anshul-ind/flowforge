'use client';

import { cn } from '@/lib/utils';

type TaskPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

interface PriorityDotProps {
  priority: TaskPriority;
  label?: boolean;
  className?: string;
}

const priorityMap: Record<
  TaskPriority,
  { color: string; label: string }
> = {
  URGENT: { color: 'bg-priority-urgent', label: 'Urgent' },
  HIGH: { color: 'bg-priority-high', label: 'High' },
  MEDIUM: { color: 'bg-priority-medium', label: 'Medium' },
  LOW: { color: 'bg-priority-low', label: 'Low' },
};

export function PriorityDot({
  priority,
  label = false,
  className,
}: PriorityDotProps) {
  const config = priorityMap[priority];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn('w-2 h-2 rounded-full', config.color)}
        aria-label={config.label}
      />
      {label && (
        <span className="text-xs font-medium text-text-secondary">
          {config.label}
        </span>
      )}
    </div>
  );
}
