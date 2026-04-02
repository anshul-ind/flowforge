/**
 * Error Message Component
 * 
 * Displays error state with optional reset button
 * Used in error.tsx boundary components
 */
export function ErrorMessage({
  title,
  message,
  onReset,
}: {
  title: string;
  message: string;
  onReset?: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white rounded-lg border border-red-200 p-8 max-w-md text-center">
        {/* Error icon */}
        <div className="mb-4 text-5xl">⚠️</div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>

        {onReset && (
          <button
            onClick={onReset}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
