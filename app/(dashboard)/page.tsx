/**
 * Dashboard Home Page
 * 
 * Redirect or redirect to first workspace
 * In Phase-7, will show workspace list or create workspace form
 * For now, show a placeholder
 */
export default function DashboardPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Welcome to FlowForge</h1>
        <p className="text-gray-500 mt-2">Select or create a workspace to get started</p>
      </div>
    </div>
  );
}
