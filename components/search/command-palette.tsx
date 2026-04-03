'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

interface SearchResultRow {
  id: string
  title: string
  subtitle: string | null
  href: string
  status?: string
  priority?: string
  type: 'project' | 'task'
  updatedAt?: string
}

/**
 * Command Palette (Cmd+K)
 * Workspace search via GET /api/search
 */
export function CommandPalette({ workspaceId }: { workspaceId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResultRow[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
        setTimeout(() => inputRef.current?.focus(), 50)
      }

      if (isOpen && e.key === 'Escape') {
        setIsOpen(false)
        setQuery('')
        setResults([])
      }

      if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedIndex((prev) => Math.min(prev + 1, Math.max(results.length - 1, 0)))
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedIndex((prev) => Math.max(prev - 1, 0))
        } else if (e.key === 'Enter' && results[selectedIndex]) {
          e.preventDefault()
          window.location.href = results[selectedIndex].href
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex])

  const handleSearch = useCallback(
    async (q: string) => {
      setQuery(q)
      setSelectedIndex(0)

      if (!q.trim()) {
        setResults([])
        return
      }

      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      setIsLoading(true)

      debounceRef.current = setTimeout(async () => {
        try {
          const qs = new URLSearchParams({
            workspaceId,
            q: q.trim(),
            type: 'all',
            limit: '12',
          })
          const res = await fetch(`/api/search?${qs.toString()}`)

          if (!res.ok) {
            setResults([])
            return
          }

          const data = await res.json()
          if (!data.ok || !Array.isArray(data.results)) {
            setResults([])
            return
          }

          const mapped: SearchResultRow[] = data.results.map(
            (r: {
              kind: string
              id: string
              title: string
              subtitle: string | null
              href: string
              meta?: Record<string, unknown>
              updatedAt?: string
            }) => ({
              id: r.id,
              title: r.title,
              subtitle: r.subtitle,
              href: r.href,
              type: r.kind as 'project' | 'task',
              status: r.meta?.status != null ? String(r.meta.status) : undefined,
              priority: r.meta?.priority != null ? String(r.meta.priority) : undefined,
              updatedAt: r.updatedAt,
            })
          )
          setResults(mapped)
        } catch (error) {
          console.error('Search error:', error)
          setResults([])
        } finally {
          setIsLoading(false)
        }
      }, 280)
    },
    [workspaceId]
  )

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

      <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search projects, tasks..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1 text-lg outline-none"
              autoComplete="off"
            />
            <span className="ml-4 text-xs text-gray-400">ESC to close</span>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading && (
            <div className="p-8 text-center text-gray-500">
              <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            </div>
          )}

          {!isLoading && results.length === 0 && query && (
            <div className="p-8 text-center text-gray-500">No results for "{query}"</div>
          )}

          {!isLoading && results.length === 0 && !query && (
            <div className="p-8 text-center text-gray-500">Start typing to search...</div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="divide-y divide-gray-100">
              {results.filter((r) => r.type === 'project').length > 0 && (
                <div>
                  <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500">PROJECTS</div>
                  {results
                    .filter((r) => r.type === 'project')
                    .map((result) => (
                      <Link
                        key={result.id}
                        href={result.href}
                        onClick={() => setIsOpen(false)}
                        className={clsx(
                          'block px-4 py-3 transition-colors',
                          selectedIndex === results.indexOf(result) ? 'bg-blue-50' : 'hover:bg-gray-50'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-gray-900">{result.title}</p>
                            {result.subtitle && (
                              <p className="line-clamp-1 text-sm text-gray-500">{result.subtitle}</p>
                            )}
                          </div>
                          {result.status && (
                            <span className="flex-shrink-0 rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                              {result.status}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                </div>
              )}

              {results.filter((r) => r.type === 'task').length > 0 && (
                <div>
                  <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500">TASKS</div>
                  {results
                    .filter((r) => r.type === 'task')
                    .map((result) => {
                      const priorityColors: Record<string, string> = {
                        LOW: 'bg-gray-100 text-gray-700',
                        MEDIUM: 'bg-blue-100 text-blue-700',
                        HIGH: 'bg-orange-100 text-orange-700',
                        URGENT: 'bg-red-100 text-red-700',
                      }

                      return (
                        <Link
                          key={result.id}
                          href={result.href}
                          onClick={() => setIsOpen(false)}
                          className={clsx(
                            'block px-4 py-3 transition-colors',
                            selectedIndex === results.indexOf(result) ? 'bg-blue-50' : 'hover:bg-gray-50'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={clsx('h-2 w-2 flex-shrink-0 rounded-full', {
                                'bg-gray-300': result.priority === 'LOW',
                                'bg-blue-500': result.priority === 'MEDIUM',
                                'bg-orange-500': result.priority === 'HIGH',
                                'bg-red-500': result.priority === 'URGENT',
                              })}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-gray-900">{result.title}</p>
                              <p className="text-xs text-gray-500">
                                {result.subtitle}
                                {result.updatedAt
                                  ? ` · ${formatDistanceToNow(new Date(result.updatedAt), { addSuffix: true })}`
                                  : ''}
                              </p>
                            </div>
                            {result.priority && (
                              <span
                                className={clsx(
                                  'flex-shrink-0 rounded px-2 py-1 text-xs',
                                  priorityColors[result.priority || 'MEDIUM']
                                )}
                              >
                                {result.priority}
                              </span>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
