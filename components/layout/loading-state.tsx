/**
 * Loading Skeleton Component
 * 
 * Displays a skeleton/loading state while data is being fetched
 * Used in loading.tsx files for route segments
 */
export function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-gray-200 rounded-lg"></div>
        <div className="h-4 w-32 bg-gray-100 rounded"></div>
      </div>

      {/* Content grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <div className="h-6 w-32 bg-gray-200 rounded-lg"></div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-100 rounded"></div>
              <div className="h-4 w-3/4 bg-gray-100 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Loading State Wrapper
 * Wraps loading content with consistent styling
 */
export function LoadingState({
  title = 'Loading...',
}: {
  title?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
      <div className="animate-spin">
        <svg
          className="w-12 h-12 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
      <p className="text-gray-600 text-lg font-medium">{title}</p>
    </div>
  );
}
