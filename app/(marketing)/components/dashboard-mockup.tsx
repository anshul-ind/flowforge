'use client'

import { cn } from '@/lib/utils'

export function DashboardMockup() {
  return (
    <div className={cn(
      'rounded-xl overflow-hidden border',
      'bg-background shadow-2xl',
      'grid'
    )}>
      {/* Header */}
      <div className="grid grid-cols-[240px_1fr] bg-surface-raised border-b">
        {/* Sidebar header */}
        <div className="px-6 py-4 border-r bg-background">
          <div className="h-6 w-24 bg-brand/20 rounded" />
        </div>
        {/* Top bar */}
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex gap-2">
            <div className="h-6 w-32 bg-muted/20 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-full bg-muted/20" />
            <div className="h-8 w-8 rounded-full bg-muted/20" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <div className="bg-background border-r p-6 space-y-6">
          {/* Project list */}
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-10 rounded-lg',
                i === 0 ? 'bg-brand/10 border border-brand' : 'bg-surface-raised'
              )}
            />
          ))}
        </div>

        {/* Main content */}
        <div className="bg-surface p-8 space-y-8">
          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div 
                key={i}
                className="bg-background border rounded-lg p-4"
              >
                <div className="h-4 w-16 bg-text-muted/20 rounded mb-2" />
                <div className="h-6 w-12 bg-text-primary/20 rounded" />
              </div>
            ))}
          </div>

          {/* Task list */}
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-12 rounded-lg border bg-background',
                  i === 0 ? 'border-brand/30' : ''
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
