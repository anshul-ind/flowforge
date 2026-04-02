'use client';

import { TaskFilterBar, type TaskFilters } from '@/components/search';
import { useState } from 'react';

interface TaskFilterWrapperProps {
  onFiltersChange?: (filters: TaskFilters) => void;
}

/**
 * Task Filter Wrapper (Client Component)
 * Wraps TaskFilterBar to manage state without passing handlers from server
 */
export function TaskFilterWrapper({ onFiltersChange }: TaskFilterWrapperProps) {
  const [filters, setFilters] = useState<TaskFilters>({});

  const handleFiltersChange = (newFilters: TaskFilters) => {
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  return <TaskFilterBar onFiltersChange={handleFiltersChange} />;
}
