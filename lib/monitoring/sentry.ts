/**
 * Sentry Error Tracking Configuration
 * 
 * Captures and reports runtime errors to Sentry for monitoring
 * Includes user context, breadcrumbs, and performance tracking
 * 
 * Environment Setup:
 * - SENTRY_DSN: Set in .env and .env.production
 * - SENTRY_AUTH_TOKEN: For source maps upload (optional)
 */

import * as Sentry from '@sentry/nextjs';

export function initializeSentry() {
  // Skip initialization if no DSN configured
  if (!process.env.SENTRY_DSN) {
    console.warn('Sentry DSN not configured, error tracking disabled');
    return;
  }

  // Initialize Sentry
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    
    // Enable tracing for performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Ignore certain errors (reduce noise)
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      // Ignore 404s on random URLs
      /^404 error|NotFound/,
      // Ignore user cancelled actions
      /cancelled|cancelled request|abort/i,
    ],

    // Attach stack traces to all messages (default: only errors)
    attachStacktrace: true,

    // Capture source maps for better stack traces
    includeLocalVariables: process.env.NODE_ENV !== 'production',

    // Integrations
    integrations: [
      // Next.js specific integrations
      Sentry.replayIntegration({
        // Mask all text content but keep document structure
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Replays config
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
  });
}

/**
 * Capture exception in try-catch
 */
export function captureException(
  error: Error,
  context?: Record<string, any>
) {
  Sentry.captureException(error, {
    contexts: context ? { custom: context } : undefined,
  });
}

/**
 * Capture message (non-error event)
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: Record<string, any>
) {
  Sentry.captureMessage(message, level);
  if (context) {
    Sentry.setContext('custom', context);
  }
}

/**
 * Set user context for all subsequent errors
 */
export function setUserContext(userId: string, email?: string) {
  Sentry.setUser({
    id: userId,
    email: email,
  });
}

/**
 * Clear user context
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Set workspace context
 */
export function setWorkspaceContext(workspaceId: string) {
  Sentry.setTag('workspaceId', workspaceId);
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addBreadcrumb(
  message: string,
  data?: Record<string, any>,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info'
) {
  Sentry.addBreadcrumb({
    message,
    level,
    data,
  });
}

/**
 * Create an error boundary component
 */
export function createErrorBoundary(
  component: React.ComponentType<{
    error: Error & { digest?: string };
    reset: () => void;
  }>
) {
  return component;
}

/**
 * Wrapper for API route handlers to capture errors
 */
export async function withErrorReporting<T>(
  fn: () => Promise<T>,
  context?: {
    userId?: string;
    workspaceId?: string;
    action?: string;
  }
): Promise<T> {
  try {
    if (context?.workspaceId) {
      setWorkspaceContext(context.workspaceId);
    }
    if (context?.userId) {
      setUserContext(context.userId);
    }

    return await fn();
  } catch (error) {
    captureException(error as Error, {
      action: context?.action,
      userId: context?.userId,
      workspaceId: context?.workspaceId,
    });
    throw error;
  }
}
