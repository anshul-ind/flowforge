'use client';

import { cn } from '@/lib/utils';

type TaskStatus =
  | 'BACKLOG'
  | 'TODO'
  | 'IN_PROGRESS'
  | 'IN_REVIEW'
  | 'DONE'
  | 'BLOCKED';

interface StatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md';
  className?: string;
}

const statusMap: Record<
  TaskStatus,
  { bg: string; text: string; label: string }
> = {
  BACKLOG: {
    bg: 'bg-status-backlog',
    text: 'text-status-backlog-text',
    label: 'Backlog',
  },
  TODO: {
    bg: 'bg-status-todo',
    text: 'text-status-todo-text',
    label: 'To Do',
  },
  IN_PROGRESS: {
    bg: 'bg-status-inprogress',
    text: 'text-status-inprogress-text',
    label: 'In Progress',
  },
  IN_REVIEW: {
    bg: 'bg-status-inreview',
    text: 'text-status-inreview-text',
    label: 'In Review',
  },
  DONE: {
    bg: 'bg-status-done',
    text: 'text-status-done-text',
    label: 'Done',
  },
  BLOCKED: {
    bg: 'bg-status-blocked',
    text: 'text-status-blocked-text',
    label: 'Blocked',
  },
};

export function StatusBadge({
  status,
  size = 'md',
  className,
}: StatusBadgeProps) {
  const config = statusMap[status];

  return (
    <span
      className={cn(
        config.bg,
        config.text,
        size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        'rounded-sm font-medium uppercase tracking-wide inline-flex items-center',
        className
      )}
    >
      {config.label}
    </span>
  );
}
