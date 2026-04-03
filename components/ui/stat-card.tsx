'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  trendLabel?: string;
  icon?: LucideIcon;
  onClick?: () => void;
  className?: string;
}

export function StatCard({
  label,
  value,
  trend,
  trendLabel,
  icon: Icon,
  onClick,
  className,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-surface-raised border border-border rounded-lg p-6',
        'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-secondary uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className="text-2xl font-semibold text-primary">{value}</p>
        </div>
        {Icon && (
          <div className="p-2 bg-accent rounded-md">
            <Icon className="w-5 h-5 text-accent-foreground" />
          </div>
        )}
      </div>

      {trend && (
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'px-2 py-1 rounded-full text-xs font-medium',
              trend.isPositive
                ? 'bg-success/20 text-success'
                : 'bg-danger/20 text-danger'
            )}
          >
            {trend.isPositive ? '+' : '-'}
            {Math.abs(trend.value)}%
          </div>
          {trendLabel && (
            <span className="text-xs text-secondary">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
