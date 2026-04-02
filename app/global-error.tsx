'use client';

import React, { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Capture error to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          digest: error.digest,
        },
      },
    });
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
          <h1>Something went wrong!</h1>
          <p>{error.message}</p>
          {error.digest && (
            <p style={{ color: '#666', fontSize: '12px' }}>
              Error ID: {error.digest}
            </p>
          )}
          <button onClick={() => reset()}>Try again</button>
        </div>
      </body>
    </html>
  );
}
