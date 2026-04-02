import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for project detail page
 */
export default function ProjectLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Content grid skeleton */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-32" />
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  );
}
