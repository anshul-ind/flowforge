import { ErrorMessage } from '../ui/error-message';

/**
 * Error Boundary Fallback Component
 * 
 * Used in error.tsx files to display error messages
 * Shows user-friendly error UI with retry button
 */
export function ErrorBoundaryFallback({
  error,
  reset,
  title = 'Something went wrong',
  description = `We encountered an error loading this page. 
  Please try again or contact support if the problem persists.`,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-96 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 text-lg">{description}</p>
      </div>

      {/* Error details (dev mode) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
          <summary className="cursor-pointer font-medium text-red-900">
            Error Details (Dev Only)
          </summary>
          <pre className="mt-2 overflow-auto text-red-700 text-xs">
            {error.message}
            {error.digest && `\nDigest: ${error.digest}`}
          </pre>
        </details>
      )}

      {/* Action buttons */}
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Try Again
        </button>
        <a
          href="/workspace"
          className="px-6 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          Back to Workspace
        </a>
      </div>
    </div>
  );
}

/**
 * Not Found Error Fallback
 * Used when a resource is not found
 */
export function NotFoundFallback({
  reset,
  resource = 'page',
}: {
  reset?: () => void;
  resource?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-96 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">404 - Not Found</h1>
        <p className="text-gray-600">
          The {resource} you&apos;re looking for doesn&apos;t exist.
        </p>
      </div>

      <div className="flex gap-4">
        {reset && (
          <button
            onClick={reset}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
        )}
        <a
          href="/workspace"
          className="px-6 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          Back Home
        </a>
      </div>
    </div>
  );
}
