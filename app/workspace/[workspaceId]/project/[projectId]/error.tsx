'use client';

import { ErrorMessage } from '@/components/ui/error-message';

/**
 * Error boundary for project detail pages
 */
export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const title = error.name === 'NotFoundError' ? '404 - Project Not Found' : 'Error loading project';

  const message =
    error.name === 'NotFoundError'
      ? 'The project you are looking for does not exist.'
      : error.message || 'Failed to load project. Please try again.';

  return <ErrorMessage title={title} message={message} onReset={reset} />;
}
