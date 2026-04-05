import { headers } from 'next/headers'

/**
 * Public origin for invite links and emails.
 *
 * Order matters: `AUTH_URL` is often `http://localhost:3000` during local dev (correct for
 * NextAuth on this machine) but wrong for shareable invite links. Prefer explicit public URLs first.
 *
 * Set `APP_URL` and/or `NEXT_PUBLIC_APP_URL` to your production host (e.g. Vercel) so invites work on any device.
 */
export async function resolveAppBaseUrl(): Promise<string> {
  const appUrl = process.env.APP_URL?.replace(/\/$/, '')?.trim()
  if (appUrl) return appUrl

  const publicUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')?.trim()
  if (publicUrl) return publicUrl

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`
  }

  const authUrl = process.env.AUTH_URL?.replace(/\/$/, '')?.trim()
  if (authUrl) return authUrl

  const nextAuthUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, '')?.trim()
  if (nextAuthUrl) return nextAuthUrl

  const h = await headers()
  const origin = h.get('origin')?.trim()
  if (origin) return origin.replace(/\/$/, '')

  const proto =
    h.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
    h.get('x-forwarded-protocol')?.split(',')[0]?.trim() ||
    'http'
  const host =
    h.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    h.get('host')?.trim()

  if (host) return `${proto}://${host}`.replace(/\/$/, '')

  console.warn('[resolveAppBaseUrl] Could not determine app base URL; using localhost fallback')
  return 'http://localhost:3000'
}
