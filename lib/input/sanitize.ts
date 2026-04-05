/**
 * Input Sanitization Utilities
 * Server-safe version
 */

export function sanitizeText(input: string | null | undefined): string {
  if (!input) return '';

  return input
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeCommentBody(
  input: string | null | undefined
): string {
  if (!input) return '';

  return input.trim();
}

export function sanitizeUrl(
  input: string | null | undefined
): string | null {
  if (!input) return null;

  try {
    const url = new URL(input);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

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

export function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}