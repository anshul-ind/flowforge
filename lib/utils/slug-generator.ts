/**
 * Generate a URL-safe slug from a string
 * 
 * Rules:
 * - Convert to lowercase
 * - Replace spaces and underscores with hyphens
 * - Remove special characters (keep only alphanumeric + hyphens)
 * - Remove duplicate hyphens
 * - Trim leading/trailing hyphens
 * 
 * Examples:
 * - "My Workspace" → "my-workspace"
 * - "Acme Corp_2024" → "acme-corp-2024"
 * - "Health & Safety" → "health-safety"
 */
export function generateSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove any character that's not alphanumeric or hyphen
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}
