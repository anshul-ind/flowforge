import { Skeleton } from '@/components/ui/skeleton'

/**
 * Full-viewport loading overlay so the dashboard shell is not visible during suspense.
 */
export default function WorkspaceLoading() {
  return (
    <div className="fixed inset-0 z-[150] overflow-y-auto bg-gray-50/98 px-6 pt-24 pb-16 md:pt-28">
      <div className="mx-auto w-full max-w-5xl space-y-6 pb-12">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 p-6">
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="divide-y divide-gray-200">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
