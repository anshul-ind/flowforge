import type { TaskStatus } from '@/lib/generated/prisma'

export function TasksByStatusChart({
  rows,
  maxCount,
}: {
  rows: { status: TaskStatus; count: number }[]
  maxCount: number
}) {
  return (
    <div className="space-y-4">
      {rows.map((item) => {
        const pct = maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0
        return (
          <div key={item.status}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-secondary">{item.status.replace(/_/g, ' ')}</span>
              <span className="text-sm font-semibold text-primary">{item.count}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-border">
              <div
                className={`h-2 rounded-full ${
                  item.status === 'DONE'
                    ? 'bg-success'
                    : item.status === 'BLOCKED'
                      ? 'bg-danger'
                      : item.status === 'IN_REVIEW'
                        ? 'bg-warning'
                        : 'bg-info'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
