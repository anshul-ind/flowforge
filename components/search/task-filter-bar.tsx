'use client';

import { useState, useCallback } from 'react';
import clsx from 'clsx';

export interface TaskFilters {
  status?: string[];
  priority?: string[];
  assignee?: string[];
  dueDate?: 'today' | 'week' | 'month' | 'overdue';
}

interface TaskFilterBarProps {
  onFiltersChange: (filters: TaskFilters) => void;
  isLoading?: boolean;
}

/**
 * Task Filter Bar
 * Allows filtering tasks by status, priority, assignee, and due date
 */
export function TaskFilterBar({ onFiltersChange, isLoading = false }: TaskFilterBarProps) {
  const [filters, setFilters] = useState<TaskFilters>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStatusToggle = useCallback((status: string) => {
    setFilters(prev => {
      const newStatuses = prev.status?.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...(prev.status || []), status];
      
      const newFilters = newStatuses.length > 0
        ? { ...prev, status: newStatuses }
        : { ...prev };
      delete newFilters.status;
      
      onFiltersChange(newFilters);
      return newFilters;
    });
  }, [onFiltersChange]);

  const handlePriorityToggle = useCallback((priority: string) => {
    setFilters(prev => {
      const newPriorities = prev.priority?.includes(priority)
        ? prev.priority.filter(p => p !== priority)
        : [...(prev.priority || []), priority];
      
      const newFilters = newPriorities.length > 0
        ? { ...prev, priority: newPriorities }
        : { ...prev };
      delete newFilters.priority;
      
      onFiltersChange(newFilters);
      return newFilters;
    });
  }, [onFiltersChange]);

  const handleDueDateChange = useCallback((period: 'today' | 'week' | 'month' | 'overdue') => {
    setFilters(prev => {
      const newFilters = prev.dueDate === period
        ? { ...prev }
        : { ...prev, dueDate: period };
      
      if (prev.dueDate === period) {
        delete newFilters.dueDate;
      }
      
      onFiltersChange(newFilters);
      return newFilters;
    });
  }, [onFiltersChange]);

  const clearFilters = useCallback(() => {
    setFilters({});
    onFiltersChange({});
  }, [onFiltersChange]);

  const activeFilterCount = Object.values(filters).filter(v => v && (Array.isArray(v) ? v.length > 0 : !!v)).length;

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        {/* Compact view */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Filters</h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {isExpanded ? 'Hide filters' : 'Show filters'}
          </button>
        </div>

        {/* Expanded view */}
        {isExpanded && (
          <div className="space-y-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {['OPEN', 'IN_PROGRESS', 'REVIEW', 'DONE'].map(status => (
                  <button
                    key={status}
                    onClick={() => handleStatusToggle(status)}
                    disabled={isLoading}
                    className={clsx(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                      filters.status?.includes(status)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <div className="flex flex-wrap gap-2">
                {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(priority => (
                  <button
                    key={priority}
                    onClick={() => handlePriorityToggle(priority)}
                    disabled={isLoading}
                    className={clsx(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                      filters.priority?.includes(priority)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                      {
                        'bg-gray-300': priority === 'LOW' && !filters.priority?.includes(priority),
                        'bg-blue-100': priority === 'MEDIUM' && !filters.priority?.includes(priority),
                        'bg-orange-100': priority === 'HIGH' && !filters.priority?.includes(priority),
                        'bg-red-100': priority === 'URGENT' && !filters.priority?.includes(priority),
                      }
                    )}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'today', label: 'Due Today' },
                  { value: 'week', label: 'Due This Week' },
                  { value: 'month', label: 'Due This Month' },
                  { value: 'overdue', label: 'Overdue' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handleDueDateChange(value as any)}
                    disabled={isLoading}
                    className={clsx(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                      filters.dueDate === value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear filters */}
            {activeFilterCount > 0 && (
              <div className="pt-2">
                <button
                  onClick={clearFilters}
                  disabled={isLoading}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
                >
                  <span className="text-base">✕</span>
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Active filters summary */}
        {!isExpanded && activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            {filters.status && (
              <div className="flex gap-1 flex-wrap">
                {filters.status.map(status => (
                  <button
                    key={status}
                    onClick={() => handleStatusToggle(status)}
                    className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 hover:bg-blue-200 transition-colors"
                  >
                    {status}
                    <span className="text-xs">✕</span>
                  </button>
                ))}
              </div>
            )}
            {filters.priority && (
              <div className="flex gap-1 flex-wrap">
                {filters.priority.map(priority => (
                  <button
                    key={priority}
                    onClick={() => handlePriorityToggle(priority)}
                    className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 hover:bg-blue-200 transition-colors"
                  >
                    {priority}
                    <span className="text-xs">✕</span>
                  </button>
                ))}
              </div>
            )}
            {filters.dueDate && (
              <button
                onClick={() => handleDueDateChange(filters.dueDate as any)}
                className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 hover:bg-blue-200 transition-colors"
              >
                {filters.dueDate === 'today' && 'Due Today'}
                {filters.dueDate === 'week' && 'Due This Week'}
                {filters.dueDate === 'month' && 'Due This Month'}
                {filters.dueDate === 'overdue' && 'Overdue'}
                <span className="text-xs">✕</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
