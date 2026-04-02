'use client';

import { useEffect } from 'react';
import { initClientSentry } from '@/lib/monitoring/sentry.client';

export function SentryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Initialize Sentry on client side
    initClientSentry();
  }, []);

  return <>{children}</>;
}
