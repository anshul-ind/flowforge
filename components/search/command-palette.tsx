'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

interface SearchResult {
  id: string;
  name?: string;
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  projectName?: string;
  type: 'project' | 'task';
}

/**
 * Command Palette (Cmd+K)
 * Global search with keyboard navigation
 */
export function CommandPalette({ workspaceId }: { workspaceId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }

      if (isOpen && e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
        setResults([]);
      }

      // Arrow key navigation
      if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && results[selectedIndex]) {
          e.preventDefault();
          const result = results[selectedIndex];
          const href = result.type === 'project'
            ? `/workspace/${workspaceId}/project/${result.id}`
            : `/workspace/${workspaceId}/project/${result.projectName}/tasks/${result.id}`;
          window.location.href = href;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, workspaceId]);

  // Search handler with debounce
  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    setSelectedIndex(0);

    if (!q.trim()) {
      setResults([]);
      return;
    }

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setIsLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/workspace/${workspaceId}/search?q=${encodeURIComponent(q)}&limit=10`
        );

        if (res.ok) {
          const data = await res.json();
          const combined: SearchResult[] = [
            ...data.data.projects.map((p: any) => ({ ...p, type: 'project' as const })),
            ...data.data.tasks.map((t: any) => ({ ...t, type: 'task' as const, projectName: t.project?.name })),
          ];
          setResults(combined.slice(0, 10));
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce
  }, [workspaceId]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-2xl mx-auto bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search projects, tasks..."
              value={query}
              onChange={e => handleSearch(e.target.value)}
              className="flex-1 text-lg outline-none"
              autoComplete="off"
            />
            <span className="text-xs text-gray-400 ml-4">ESC to close</span>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading && (
            <div className="p-8 text-center text-gray-500">
              <div className="inline-block animate-spin h-5 w-5 border-2 border-gray-300 border-t-blue-600 rounded-full" />
            </div>
          )}

          {!isLoading && results.length === 0 && query && (
            <div className="p-8 text-center text-gray-500">
              No results for "{query}"
            </div>
          )}

          {!isLoading && results.length === 0 && !query && (
            <div className="p-8 text-center text-gray-500">
              Start typing to search...
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="divide-y divide-gray-100">
              {/* Projects section */}
              {results.filter(r => r.type === 'project').length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                    PROJECTS
                  </div>
                  {results
                    .filter(r => r.type === 'project')
                    .map((result, idx) => (
                      <Link
                        key={result.id}
                        href={`/workspace/${workspaceId}/project/${result.id}`}
                        onClick={() => setIsOpen(false)}
                        className={clsx(
                          'block px-4 py-3 transition-colors',
                          selectedIndex === results.indexOf(result)
                            ? 'bg-blue-50'
                            : 'hover:bg-gray-50'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {result.name}
                            </p>
                            {result.description && (
                              <p className="text-sm text-gray-500 line-clamp-1">
                                {result.description}
                              </p>
                            )}
                          </div>
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded flex-shrink-0">
                            {result.status}
                          </span>
                        </div>
                      </Link>
                    ))}
                </div>
              )}

              {/* Tasks section */}
              {results.filter(r => r.type === 'task').length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                    TASKS
                  </div>
                  {results
                    .filter(r => r.type === 'task')
                    .map((result, idx) => {
                      const priorityColors: Record<string, string> = {
                        LOW: 'bg-gray-100 text-gray-700',
                        MEDIUM: 'bg-blue-100 text-blue-700',
                        HIGH: 'bg-orange-100 text-orange-700',
                        URGENT: 'bg-red-100 text-red-700',
                      };

                      return (
                        <div
                          key={result.id}
                          className={clsx(
                            'px-4 py-3 transition-colors',
                            selectedIndex === results.indexOf(result)
                              ? 'bg-blue-50'
                              : 'hover:bg-gray-50'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={clsx(
                              'w-2 h-2 rounded-full flex-shrink-0',
                              {
                                'bg-gray-300': result.priority === 'LOW',
                                'bg-blue-500': result.priority === 'MEDIUM',
                                'bg-orange-500': result.priority === 'HIGH',
                                'bg-red-500': result.priority === 'URGENT',
                              }
                            )} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {result.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {result.projectName}
                              </p>
                            </div>
                            <span className={clsx(
                              'text-xs px-2 py-1 rounded flex-shrink-0',
                              priorityColors[result.priority || 'MEDIUM']
                            )}>
                              {result.priority}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
