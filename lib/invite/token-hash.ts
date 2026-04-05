import { createHash, randomBytes } from 'crypto'

/** SHA-256 hex digest — used for invite token storage and lookup (never store raw tokens). */
export function hashInviteToken(rawToken: string): string {
  return createHash('sha256').update(rawToken, 'utf8').digest('hex')
}

/** URL-safe opaque token for invite links (raw value sent once in email / URL only). */
export function generateInviteRawToken(): string {
  return randomBytes(32).toString('base64url')
}
