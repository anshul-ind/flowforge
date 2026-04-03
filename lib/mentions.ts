/**
 * Extract @handles from comment text (lowercase, unique).
 * Handles: letters, digits, dot, underscore, hyphen.
 */
export function extractMentionHandles(body: string): string[] {
  const matches = body.match(/@([a-zA-Z0-9._-]+)/g) || []
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))]
}
