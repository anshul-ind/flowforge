'use client';

import { ErrorMessage } from '@/components/ui/error-message';

/**
 * Error boundary for workspace pages
 * 
 * Catches errors thrown in the workspace layout or page and displays them
 * Maps specific error types to user-friendly messages
 */
export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const title =
    error.name === 'ForbiddenError' ? '403 - Access Denied' : 'Something went wrong';

  const message =
    error.name === 'ForbiddenError'
      ? 'You do not have permission to access this workspace.'
      : error.message || 'An unexpected error occurred. Please try again.';

  return <ErrorMessage title={title} message={message} onReset={reset} />;
}
