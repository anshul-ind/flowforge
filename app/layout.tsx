import type { Metadata } from 'next';
import './globals.css';

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
      <body>{children}</body>
    </html>
  );
}
