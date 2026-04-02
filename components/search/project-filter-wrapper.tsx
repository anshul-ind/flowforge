'use client';

import { ProjectFilterBar, type ProjectFilters } from '@/components/search';
import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface ProjectFilterWrapperProps {
  onFiltersChange?: (filters: ProjectFilters) => void;
}

/**
 * Project Filter Wrapper (Client Component)
 * Wraps ProjectFilterBar to manage state and update URL query params
 */
export function ProjectFilterWrapper({ onFiltersChange }: ProjectFilterWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<ProjectFilters>({});

  const handleFiltersChange = useCallback((newFilters: ProjectFilters) => {
    setFilters(newFilters);
    
    // Update URL with filter params (non-blocking)
    const params = new URLSearchParams(searchParams);
    
    // Clear existing filter params
    params.delete('status');
    params.delete('member');
    params.delete('createdAfter');
    params.delete('createdBefore');
    
    // Add new filter params
    if (newFilters.status && newFilters.status.length > 0) {
      params.set('status', newFilters.status.join(','));
    }
    if (newFilters.member && newFilters.member.length > 0) {
      params.set('member', newFilters.member.join(','));
    }
    if (newFilters.createdAfter) {
      params.set('createdAfter', newFilters.createdAfter);
    }
    if (newFilters.createdBefore) {
      params.set('createdBefore', newFilters.createdBefore);
    }
    
    // Update URL without full page reload
    const newUrl = `?${params.toString()}`;
    router.push(newUrl);
    
    onFiltersChange?.(newFilters);
  }, [router, searchParams, onFiltersChange]);

  return <ProjectFilterBar onFiltersChange={handleFiltersChange} memberOptions={[]} />;
}
