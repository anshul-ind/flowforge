export function WorkloadChart({
  rows,
}: {
  rows: {
    userId: string
    name: string | null
    email: string | null
    openTasks: number
  }[]
}) {
  const max = rows.length ? Math.max(...rows.map((r) => r.openTasks), 1) : 1

  return (
    <div className="space-y-4">
      {rows.length === 0 && (
        <p className="text-sm text-tertiary">No assigned open tasks in this workspace.</p>
      )}
      {rows.map((member) => {
        const label = member.name || member.email || member.userId.slice(0, 8)
        const intensity = Math.round((member.openTasks / max) * 100)
        return (
          <div key={member.userId} className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-primary">{label}</p>
              <p className="text-xs text-secondary">{member.openTasks} open tasks</p>
            </div>
            <div className="h-2 w-24 max-w-[40%] rounded-full bg-border">
              <div
                className="h-2 rounded-full bg-brand"
                style={{ width: `${intensity}%`, minWidth: member.openTasks ? '4px' : 0 }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
