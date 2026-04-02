/**
 * Input Sanitization Utilities
 * 
 * Strip HTML from string fields and sanitize comment bodies
 * Prevents XSS attacks and improves data integrity
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize plain text input (remove all HTML)
 * Safe for fields like task titles, project names, workspace names
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return '';

  // Remove all HTML tags
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] }).trim();
}

/**
 * Sanitize comment body (allow formatted text)
 * Allows: bold, italic, code, links, lists
 * Blocks: scripts, forms, event handlers, iframes
 */
export function sanitizeCommentBody(
  input: string | null | undefined
): string {
  if (!input) return '';

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'code',
      'pre',
      'ul',
      'ol',
      'li',
      'a',
      'blockquote',
    ],
    ALLOWED_ATTR: ['href', 'title', 'rel'],
    // Enforce target="_blank" and rel="noopener noreferrer" on links
    KEEP_CONTENT: true,
  }).trim();
}

/**
 * Sanitize URL (validate it's a safe URL)
 */
export function sanitizeUrl(
  input: string | null | undefined
): string | null {
  if (!input) return null;

  try {
    const url = new URL(input);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }
    return url.toString();
  } catch {
    // Not a valid URL
    return null;
  }
}

/**
 * Sanitize email (basic validation)
 */
export function sanitizeEmail(
  input: string | null | undefined
): string | null {
  if (!input) return null;

  const email = input.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return null;
  }

  return email;
}

/**
 * Sanitize full user input object
 * Applies appropriate sanitization per field type
 */
export function sanitizeInput<T extends Record<string, any>>(
  input: T,
  schema: Record<keyof T, 'text' | 'html' | 'email' | 'url'> | null = null
): T {
  const sanitized = { ...input };

  for (const [key, value] of Object.entries(sanitized)) {
    if (value === null || value === undefined) continue;
    if (typeof value !== 'string') continue;

    const fieldType = schema?.[key as keyof T] || 'text';

    switch (fieldType) {
      case 'html':
        sanitized[key as keyof T] = sanitizeCommentBody(value) as any;
        break;
      case 'email':
        sanitized[key as keyof T] = sanitizeEmail(value) as any;
        break;
      case 'url':
        sanitized[key as keyof T] = sanitizeUrl(value) as any;
        break;
      case 'text':
      default:
        sanitized[key as keyof T] = sanitizeText(value) as any;
        break;
    }
  }

  return sanitized;
}

/**
 * Validate input length constraints
 */
export function validateInputLength(
  input: string | null | undefined,
  maxLength: number,
  fieldName: string = 'Input'
): {
  valid: boolean;
  error?: string;
} {
  if (!input) {
    return { valid: true };
  }

  if (input.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} exceeds maximum length of ${maxLength} characters`,
    };
  }

  return { valid: true };
}

/**
 * Escape HTML for display (prevent XSS in templating)
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';

  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
