/**
 * Workspace Stats Component
 * 
 * Displays key metrics as stat cards
 */
export function WorkspaceStats({
  memberCount,
  projectCount,
}: {
  memberCount: number;
  projectCount: number;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Projects card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Total Projects</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{projectCount}</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
            📊
          </div>
        </div>
      </div>

      {/* Members card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Active Members</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{memberCount}</p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
            👥
          </div>
        </div>
      </div>
    </div>
  );
}
