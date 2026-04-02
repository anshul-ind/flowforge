'use client';

import { ErrorMessage } from '@/components/ui/error-message';

/**
 * Error boundary for projects list page
 * 
 * Catches errors thrown in projects layout or page and displays them
 * Maps specific error types to user-friendly messages
 */
export default function ProjectsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const title =
    error.name === 'ForbiddenError' ? '403 - Access Denied' : 'Failed to Load Projects';

  const message =
    error.name === 'ForbiddenError'
      ? 'You do not have permission to view projects in this workspace.'
      : error.message || 'An unexpected error occurred while loading projects. Please try again.';

  return <ErrorMessage title={title} message={message} onReset={reset} />;
}
