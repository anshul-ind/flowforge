import type { Metadata } from 'next';
import './globals.css';
import { auth } from '@/auth';
import { AuthSessionProvider } from '@/components/providers/auth-session-provider';
import { SentryProvider } from '@/components/layout/sentry-provider';
import { ThemeProvider } from '@/lib/theme/theme-provider';
import { RootLayoutWrapper } from '@/components/layout/root-layout-wrapper';

// Initialize Sentry on server side
import { initServerSentry } from '@/lib/monitoring/sentry.server';

// Suppress Sentry initialization warning in development
if (process.env.NODE_ENV === 'production') {
  initServerSentry();
}

export const metadata: Metadata = {
  title: 'FlowForge - Project Management SaaS',
  description: 'Ship projects your team actually finishes',
  openGraph: {
    title: 'FlowForge',
    description: 'Structured workspaces, smart task flows, and built-in approvals',
    images: ['/og-image.png'],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0F0F0F" media="(prefers-color-scheme: dark)" />
      </head>
      <body>
        <ThemeProvider>
          <SentryProvider>
            <AuthSessionProvider session={session}>
              <RootLayoutWrapper>{children}</RootLayoutWrapper>
            </AuthSessionProvider>
          </SentryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
