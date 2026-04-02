'use client';

import { useState, useCallback, useEffect } from 'react';
import clsx from 'clsx';

export interface ProjectFilters {
  status?: string[];
  member?: string[];
  createdAfter?: string;
  createdBefore?: string;
}

interface ProjectFilterBarProps {
  onFiltersChange: (filters: ProjectFilters) => void;
  memberOptions?: Array<{ id: string; name: string }>;
  isLoading?: boolean;
}

/**
 * Project Filter Bar
 * Allows filtering projects by status, members, and date range
 * 
 * Fixed: Uses useEffect to avoid setState during render
 */
export function ProjectFilterBar({ 
  onFiltersChange, 
  memberOptions = [],
  isLoading = false 
}: ProjectFilterBarProps) {
  const [filters, setFilters] = useState<ProjectFilters>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingFilters, setPendingFilters] = useState<ProjectFilters | null>(null);

  // Trigger parent update asynchronously to avoid render-time state updates
  useEffect(() => {
    if (pendingFilters !== null) {
      onFiltersChange(pendingFilters);
      setPendingFilters(null);
    }
  }, [pendingFilters, onFiltersChange]);

  const handleStatusToggle = useCallback((status: string) => {
    setFilters(prev => {
      const newStatuses = prev.status?.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...(prev.status || []), status];
      
      const newFilters: ProjectFilters = { ...prev };
      if (newStatuses.length > 0) {
        newFilters.status = newStatuses;
      } else {
        delete newFilters.status;
      }
      
      setPendingFilters(newFilters);
      return newFilters;
    });
  }, []);

  const handleMemberToggle = useCallback((memberId: string) => {
    setFilters(prev => {
      const newMembers = prev.member?.includes(memberId)
        ? prev.member.filter(m => m !== memberId)
        : [...(prev.member || []), memberId];
      
      const newFilters: ProjectFilters = { ...prev };
      if (newMembers.length > 0) {
        newFilters.member = newMembers;
      } else {
        delete newFilters.member;
      }
      
      setPendingFilters(newFilters);
      return newFilters;
    });
  }, []);

  const handleDateChange = useCallback((type: 'createdAfter' | 'createdBefore', value: string) => {
    setFilters(prev => {
      const newFilters: ProjectFilters = { ...prev, [type]: value || undefined };
      if (!value) {
        delete newFilters[type];
      }
      setPendingFilters(newFilters);
      return newFilters;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPendingFilters({});
  }, []);

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
            {activeFilterCount > 0 && (
              <span className="ml-2 inline-block bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
                {activeFilterCount}
              </span>
            )}
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
                {['PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'].map(status => (
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

            {/* Team Members */}
            {memberOptions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Members
                </label>
                <div className="flex flex-wrap gap-2">
                  {memberOptions.map(member => (
                    <button
                      key={member.id}
                      onClick={() => handleMemberToggle(member.id)}
                      disabled={isLoading}
                      className={clsx(
                        'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                        filters.member?.includes(member.id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      )}
                    >
                      {member.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Created After
                </label>
                <input
                  type="date"
                  value={filters.createdAfter || ''}
                  onChange={(e) => handleDateChange('createdAfter', e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Created Before
                </label>
                <input
                  type="date"
                  value={filters.createdBefore || ''}
                  onChange={(e) => handleDateChange('createdBefore', e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                disabled={isLoading}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-all"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
