import type { NextConfig } from 'next';

const assetPrefix = process.env.ASSET_PREFIX?.trim() || undefined;

const nextConfig: NextConfig = {
  assetPrefix: assetPrefix || undefined,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // Static `tasks/new` can be shadowed by `tasks/[taskId]` in some cases; canonical route is `create`.
  async rewrites() {
    return [
      {
        source: '/workspace/:workspaceId/projects/:projectId/tasks/new',
        destination: '/workspace/:workspaceId/projects/:projectId/tasks/create',
      },
    ];
  },

  /** Baseline security headers (Phase-8). Enable HSTS only behind HTTPS. */
  async headers() {
    const base: { key: string; value: string }[] = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
    ];
    if (process.env.ENABLE_HSTS === '1') {
      base.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=15552000; includeSubDomains',
      });
    }
    return [{ source: '/:path*', headers: base }];
  },
};

export default nextConfig;
