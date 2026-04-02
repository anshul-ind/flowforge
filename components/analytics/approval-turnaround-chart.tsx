'use client';

interface ApprovalMetric {
  reviewerId: string;
  reviewerName: string;
  reviewerEmail: string;
  avgTurnaroundHours: number;
  approvalRate: number; // Percentage 0-100
  totalReviews: number;
}

interface ApprovalTurnaroundChartProps {
  data: ApprovalMetric[];
}

/**
 * Approval Turnaround Chart
 * Metric cards showing average response time per reviewer
 */
export function ApprovalTurnaroundChart({ data }: ApprovalTurnaroundChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No approval data available
      </div>
    );
  }

  const getTurnaroundColor = (hours: number) => {
    if (hours < 2) return 'text-green-600';
    if (hours < 6) return 'text-blue-600';
    if (hours < 24) return 'text-orange-600';
    return 'text-red-600';
  };

  const getTurnaroundLabel = (hours: number) => {
    if (hours < 1) return `${(hours * 60).toFixed(0)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map(item => (
        <div
          key={item.reviewerId}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all"
        >
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            {/* Avatar */}
            <div className="w-10 h-10 bg-linear-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
              {item.reviewerName.charAt(0).toUpperCase()}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{item.reviewerName}</p>
              <p className="text-xs text-gray-500 truncate">{item.reviewerEmail}</p>
            </div>
          </div>

          {/* Metrics */}
          <div className="space-y-3">
            {/* Turnaround Time */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-600 mb-1">Avg Turnaround</p>
              <div className="flex items-baseline gap-2">
                <p className={`text-2xl font-bold ${getTurnaroundColor(item.avgTurnaroundHours)}`}>
                  {getTurnaroundLabel(item.avgTurnaroundHours)}
                </p>
                <p className="text-xs text-gray-500">
                  ({item.avgTurnaroundHours.toFixed(1)} hours)
                </p>
              </div>
            </div>

            {/* Approval Rate */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-600 mb-1">Approval Rate</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${item.approvalRate}%` }}
                  />
                </div>
                <p className="font-bold text-gray-900 w-10 text-right">
                  {item.approvalRate.toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Total Reviews */}
            <div className="text-center py-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">Total Reviews</p>
              <p className="font-bold text-gray-900">{item.totalReviews}</p>
            </div>
          </div>

          {/* Status indicator */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  item.avgTurnaroundHours < 6 ? 'bg-green-500' : 'bg-orange-500'
                }`}
              />
              <p className="text-xs text-gray-600">
                {item.avgTurnaroundHours < 6 ? 'On-time' : 'Needs attention'}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
