/**
 * Sentry Server-side Configuration
 * 
 * Initialize Sentry for server-side error handling
 * Called from layout.tsx root component
 */

import * as Sentry from '@sentry/nextjs';

export function initServerSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    enabled: !!process.env.SENTRY_DSN,
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Ignore irrelevant errors
    ignoreErrors: [
      /^404 error|NotFound/,
      /cancelled|abort/i,
    ],

    // Integrations
    integrations: [],
  });
}
