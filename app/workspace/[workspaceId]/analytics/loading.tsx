/**
 * Analytics Page Loading Skeleton
 * Matches the exact layout of the analytics page
 */
export default function AnalyticsLoading() {
  return (
    <div className="space-y-8 p-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-96 bg-gray-100 rounded" />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
            <div className="h-8 w-16 bg-gray-300 rounded mb-2" />
            <div className="h-3 w-32 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Tasks by Status Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="mb-6">
          <div className="h-6 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-48 bg-gray-100 rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="flex-1 h-6 bg-gray-100 rounded" />
              <div className="h-4 w-12 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Workload Chart Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="mb-6">
          <div className="h-6 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-48 bg-gray-100 rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-gray-200 rounded mb-1" />
                <div className="h-3 w-48 bg-gray-100 rounded" />
              </div>
              <div className="h-6 w-20 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Cycle Time Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="mb-6">
          <div className="h-6 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-48 bg-gray-100 rounded" />
        </div>
        <div className="flex items-end justify-center gap-4 h-48">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="flex-1 h-20 bg-gray-200 rounded flex items-end justify-center"
            />
          ))}
        </div>
      </div>

      {/* Approval Turnaround Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="mb-6">
          <div className="h-6 w-48 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-48 bg-gray-100 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
                  <div className="h-3 w-32 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-12 bg-gray-100 rounded" />
                <div className="h-12 bg-gray-100 rounded" />
                <div className="h-12 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overdue Tasks Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="mb-6">
          <div className="h-6 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-48 bg-gray-100 rounded" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-4 w-24 bg-gray-100 rounded" />
              <div className="h-4 w-20 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
