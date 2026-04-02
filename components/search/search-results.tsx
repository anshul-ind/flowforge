'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  projectId: string;
  project: {
    name: string;
  };
  createdAt: string;
}

interface SearchResults {
  projects: Project[];
  tasks: Task[];
  query: string;
}

/**
 * Full Search Results Page
 * Display comprehensive search results with filters
 */
export function SearchResultsComponent({ workspaceId }: { workspaceId: string }) {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState<SearchResults>({
    projects: [],
    tasks: [],
    query: '',
  });
  const [isLoading, setIsLoading] = useState(!!query);
  const [activeTab, setActiveTab] = useState<'all' | 'projects' | 'tasks'>('all');

  useEffect(() => {
    if (!query.trim()) {
      setResults({ projects: [], tasks: [], query: '' });
      setIsLoading(false);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/workspace/${workspaceId}/search?q=${encodeURIComponent(query)}`
        );

        if (res.ok) {
          const data = await res.json();
          setResults({
            ...data.data,
            query,
          });
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query, workspaceId]);

  const projectCount = results.projects.length;
  const taskCount = results.tasks.length;
  const totalCount = projectCount + taskCount;

  const displayProjects = activeTab === 'all' || activeTab === 'projects' ? results.projects : [];
  const displayTasks = activeTab === 'all' || activeTab === 'tasks' ? results.tasks : [];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {query ? `Search results for "${query}"` : 'Search'}
        </h1>
        {!isLoading && query && (
          <p className="text-gray-600">
            Found {totalCount} result{totalCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full" />
          <span className="ml-2 text-gray-600">Searching...</span>
        </div>
      )}

      {/* No results */}
      {!isLoading && !query && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            Use the search bar to find projects and tasks
          </p>
        </div>
      )}

      {!isLoading && query && totalCount === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">
            No results found for "{query}"
          </p>
          <p className="text-gray-400">
            Try different keywords or adjust your search
          </p>
        </div>
      )}

      {!isLoading && totalCount > 0 && (
        <>
          {/* Tabs */}
          <div className="mb-8 border-b border-gray-200">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('all')}
                className={`pb-3 px-1 font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Results ({totalCount})
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`pb-3 px-1 font-medium transition-colors ${
                  activeTab === 'projects'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Projects ({projectCount})
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`pb-3 px-1 font-medium transition-colors ${
                  activeTab === 'tasks'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tasks ({taskCount})
              </button>
            </div>
          </div>

          {/* Projects Results */}
          {displayProjects.length > 0 && (
            <div className="mb-8">
              {activeTab === 'all' && (
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Projects</h2>
              )}
              <div className="space-y-3">
                {displayProjects.map(project => (
                  <Link
                    key={project.id}
                    href={`/workspace/${workspaceId}/project/${project.id}`}
                    className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {project.name}
                        </h3>
                        {project.description && (
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                      </div>
                      <span className="ml-4 px-3 py-1 text-sm font-medium bg-gray-100 text-gray-700 rounded-full flex-shrink-0">
                        {project.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tasks Results */}
          {displayTasks.length > 0 && (
            <div>
              {activeTab === 'all' && (
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasks</h2>
              )}
              <div className="space-y-3">
                {displayTasks.map(task => {
                  const priorityColors: Record<string, string> = {
                    LOW: 'bg-gray-100 text-gray-700',
                    MEDIUM: 'bg-blue-100 text-blue-700',
                    HIGH: 'bg-orange-100 text-orange-700',
                    URGENT: 'bg-red-100 text-red-700',
                  };

                  const statusColors: Record<string, string> = {
                    OPEN: 'bg-blue-50',
                    IN_PROGRESS: 'bg-purple-50',
                    REVIEW: 'bg-amber-50',
                    DONE: 'bg-green-50',
                  };

                  return (
                    <Link
                      key={task.id}
                      href={`/workspace/${workspaceId}/project/${task.projectId}/tasks/${task.id}`}
                      className={`block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all group ${
                        statusColors[task.status] || 'bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-gray-500">
                            in {task.project.name}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                            priorityColors[task.priority] || priorityColors['MEDIUM']
                          }`}>
                            {task.priority}
                          </span>
                          <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full whitespace-nowrap">
                            {task.status}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
