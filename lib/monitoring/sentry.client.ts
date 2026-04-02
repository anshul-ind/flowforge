/**
 * Sentry Client-side Configuration
 * 
 * Initialize Sentry for client-side error handling
 * Called from layout.tsx app root
 */

import * as Sentry from '@sentry/nextjs';

export function initClientSentry() {
  if (typeof window === 'undefined') return;

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    enabled: !!(
      process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
    ),
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Session replay
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.5,
    replaysOnErrorSampleRate: 1.0,
    
    // Ignore irrelevant errors
    ignoreErrors: [
      /^404 error|NotFound/,
      /cancelled|abort/i,
      /plugin\.js/,
      /chrome:\/\//,
      /[a-z]+:\/\/chrome-extension/,
    ],

    // Integrations
    integrations: [
      // Replay integration is auto-enabled when replaysSessionSampleRate is set
    ],
  });
}
