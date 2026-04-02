import type { Metadata } from 'next';
import './globals.css';
import { SentryProvider } from '@/components/layout/sentry-provider';

// Initialize Sentry on server side
import { initServerSentry } from '@/lib/monitoring/sentry.server';

// Suppress Sentry initialization warning in development
if (process.env.NODE_ENV === 'production') {
  initServerSentry();
}

export const metadata: Metadata = {
  title: 'FlowForge - Project Management SaaS',
  description: 'Multi-tenant project management platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SentryProvider>{children}</SentryProvider>
      </body>
    </html>
  );
}
