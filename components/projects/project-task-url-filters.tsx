'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TaskStatus } from '@/lib/generated/prisma'
import type { ProjectTaskUrlFilters } from '@/lib/validation/project-task-url'

const STATUSES = Object.values(TaskStatus)

type MemberOption = { userId: string; label: string }

export function ProjectTaskUrlFilters({
  workspaceId,
  projectId,
  members,
  initial,
}: {
  workspaceId: string
  projectId: string
  members: MemberOption[]
  initial: ProjectTaskUrlFilters
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const basePath = `/workspace/${workspaceId}/projects/${projectId}`

  const [q, setQ] = useState(initial.q)
  const [status, setStatus] = useState(initial.status ?? '')
  const [assigneeId, setAssigneeId] = useState(initial.assigneeId ?? '')
  const [due, setDue] = useState(initial.due)

  const activeCount = useMemo(() => {
    let n = 0
    if (initial.q.trim()) n++
    if (initial.status) n++
    if (initial.assigneeId) n++
    if (initial.due !== 'all') n++
    return n
  }, [initial])

  const apply = useCallback(() => {
    const p = new URLSearchParams(searchParams?.toString() ?? '')
    const setOrDelete = (key: string, val: string | undefined) => {
      if (val && val.length > 0) p.set(key, val)
      else p.delete(key)
    }
    setOrDelete('q', q.trim() || undefined)
    setOrDelete('status', status || undefined)
    setOrDelete('assigneeId', assigneeId || undefined)
    if (due === 'all') p.delete('due')
    else p.set('due', due)
    const qs = p.toString()
    router.push(qs ? `${basePath}?${qs}` : basePath)
  }, [assigneeId, basePath, due, q, router, searchParams, status])

  const reset = useCallback(() => {
    setQ('')
    setStatus('')
    setAssigneeId('')
    setDue('all')
    router.push(basePath)
  }, [basePath, router])

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[140px] flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-600">Keyword</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title or description"
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Assignee</label>
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="min-w-[160px] rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Anyone</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Due</label>
          <select
            value={due}
            onChange={(e) => setDue(e.target.value as ProjectTaskUrlFilters['due'])}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="all">Any</option>
            <option value="overdue">Overdue</option>
            <option value="upcoming">Upcoming (14d)</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={apply}
            className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900"
          >
            Apply
          </button>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={reset}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      {activeCount > 0 && (
        <p className="mt-2 text-xs text-gray-500">
          {activeCount} filter{activeCount === 1 ? '' : 's'} active
        </p>
      )}
    </div>
  )
}
