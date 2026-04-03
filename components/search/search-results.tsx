'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

type ApiResult = {
  kind: 'project' | 'task'
  id: string
  title: string
  subtitle: string | null
  href: string
  meta: Record<string, unknown>
}

interface SearchResults {
  projects: { id: string; title: string; description: string | null; status: string }[]
  tasks: {
    id: string
    title: string
    description: string | null
    status: string
    priority: string
    projectId: string
    projectTitle: string | null
  }[]
  query: string
}

export function SearchResultsComponent({ workspaceId }: { workspaceId: string }) {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''

  const [results, setResults] = useState<SearchResults>({
    projects: [],
    tasks: [],
    query: '',
  })
  const [isLoading, setIsLoading] = useState(!!query)
  const [activeTab, setActiveTab] = useState<'all' | 'projects' | 'tasks'>('all')

  useEffect(() => {
    if (!query.trim()) {
      setResults({ projects: [], tasks: [], query: '' })
      setIsLoading(false)
      return
    }

    const fetchResults = async () => {
      setIsLoading(true)
      try {
        const qs = new URLSearchParams({
          workspaceId,
          q: query,
          type: 'all',
          limit: '40',
        })
        const res = await fetch(`/api/search?${qs.toString()}`)

        if (!res.ok) return

        const data = await res.json()
        if (!data.ok || !Array.isArray(data.results)) return

        const projects: SearchResults['projects'] = []
        const tasks: SearchResults['tasks'] = []

        for (const r of data.results as ApiResult[]) {
          if (r.kind === 'project') {
            projects.push({
              id: r.id,
              title: r.title,
              description: r.subtitle,
              status: String(r.meta.status ?? ''),
            })
          } else {
            tasks.push({
              id: r.id,
              title: r.title,
              description: null,
              status: String(r.meta.status ?? ''),
              priority: String(r.meta.priority ?? 'MEDIUM'),
              projectId: String(r.meta.projectId ?? ''),
              projectTitle: r.subtitle,
            })
          }
        }

        setResults({ projects, tasks, query })
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [query, workspaceId])

  const projectCount = results.projects.length
  const taskCount = results.tasks.length
  const totalCount = projectCount + taskCount

  const displayProjects = activeTab === 'all' || activeTab === 'projects' ? results.projects : []
  const displayTasks = activeTab === 'all' || activeTab === 'tasks' ? results.tasks : []

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          {query ? `Search results for "${query}"` : 'Search'}
        </h1>
        {!isLoading && query && (
          <p className="text-gray-600">
            Found {totalCount} result{totalCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <span className="ml-2 text-gray-600">Searching...</span>
        </div>
      )}

      {!isLoading && !query && (
        <div className="py-12 text-center">
          <p className="text-lg text-gray-500">Use the search bar to find projects and tasks</p>
        </div>
      )}

      {!isLoading && query && totalCount === 0 && (
        <div className="py-12 text-center">
          <p className="mb-4 text-lg text-gray-500">No results found for "{query}"</p>
          <p className="text-gray-400">Try different keywords or adjust your search</p>
        </div>
      )}

      {!isLoading && totalCount > 0 && (
        <>
          <div className="mb-8 border-b border-gray-200">
            <div className="flex gap-8">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-1 pb-3 font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Results ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('projects')}
                className={`px-1 pb-3 font-medium transition-colors ${
                  activeTab === 'projects'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Projects ({projectCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tasks')}
                className={`px-1 pb-3 font-medium transition-colors ${
                  activeTab === 'tasks'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tasks ({taskCount})
              </button>
            </div>
          </div>

          {displayProjects.length > 0 && (
            <div className="mb-8">
              {activeTab === 'all' && (
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Projects</h2>
              )}
              <div className="space-y-3">
                {displayProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/workspace/${workspaceId}/projects/${project.id}`}
                    className="group block rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                          {project.title}
                        </h3>
                        {project.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-gray-600">{project.description}</p>
                        )}
                      </div>
                      <span className="ml-4 flex-shrink-0 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                        {project.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {displayTasks.length > 0 && (
            <div>
              {activeTab === 'all' && (
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Tasks</h2>
              )}
              <div className="space-y-3">
                {displayTasks.map((task) => {
                  const priorityColors: Record<string, string> = {
                    LOW: 'bg-gray-100 text-gray-700',
                    MEDIUM: 'bg-blue-100 text-blue-700',
                    HIGH: 'bg-orange-100 text-orange-700',
                    URGENT: 'bg-red-100 text-red-700',
                  }

                  const statusColors: Record<string, string> = {
                    BACKLOG: 'bg-gray-50',
                    TODO: 'bg-blue-50',
                    IN_PROGRESS: 'bg-purple-50',
                    IN_REVIEW: 'bg-amber-50',
                    DONE: 'bg-green-50',
                    BLOCKED: 'bg-red-50',
                  }

                  return (
                    <Link
                      key={task.id}
                      href={`/workspace/${workspaceId}/projects/${task.projectId}/tasks/${task.id}`}
                      className={`block rounded-lg border border-gray-200 p-4 transition-all hover:border-blue-300 hover:shadow-md ${statusColors[task.status] || 'bg-white'}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="mt-1 line-clamp-2 text-sm text-gray-600">{task.description}</p>
                          )}
                          <p className="mt-2 text-xs text-gray-500">
                            {task.projectTitle ? `in ${task.projectTitle}` : `Project ${task.projectId}`}
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 flex-col gap-2">
                          <span
                            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                              priorityColors[task.priority] || priorityColors['MEDIUM']
                            }`}
                          >
                            {task.priority}
                          </span>
                          <span className="whitespace-nowrap rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                            {task.status}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
