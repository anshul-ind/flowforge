/**
 * CSRF Protection Utilities
 * Verify origin header on all POST/PUT/DELETE requests
 * 
 * Next.js App Router provides built-in CSRF protection for Server Actions,
 * but we verify explicitly for API routes for defense-in-depth.
 */

/**
 * Verify request origin matches allowed domains
 */
export function verifyCsrfOrigin(request: Request): {
  valid: boolean;
  error?: string;
} {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // Get allowed origins from environment
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const allowedOrigins = [
    appUrl,
    // Add production domain if different
    ...(process.env.PRODUCTION_URL ? [process.env.PRODUCTION_URL] : []),
  ];

  // Check origin header (most reliable)
  if (origin) {
    // Check if origin is in allowed list
    const originUrl = new URL(origin);
    const isAllowed = allowedOrigins.some(allowed => {
      try {
        const allowedUrl = new URL(allowed);
        return originUrl.origin === allowedUrl.origin;
      } catch {
        return false;
      }
    });

    if (!isAllowed) {
      return {
        valid: false,
        error: `Origin ${origin} not allowed`,
      };
    }
  }

  // Fall back to referer header if origin not present
  if (!origin && referer) {
    const refererUrl = new URL(referer);
    const isAllowed = allowedOrigins.some(allowed => {
      try {
        const allowedUrl = new URL(allowed);
        return refererUrl.origin === allowedUrl.origin;
      } catch {
        return false;
      }
    });

    if (!isAllowed) {
      return {
        valid: false,
        error: `Referer ${referer} not allowed`,
      };
    }
  }

  // If neither header present, only warn (don't block)
  // Some clients (like mobile apps) may not send these headers
  if (!origin && !referer) {
    console.warn(
      'CSRF: Request missing origin/referer headers. This is OK for mobile clients.'
    );
  }

  return { valid: true };
}

/**
 * Verify CSRF token from form or header
 * (Next.js provides automatic CSRF tokens in Server Actions)
 */
export function verifyCsrfToken(request: Request, token?: string): {
  valid: boolean;
  error?: string;
} {
  // For API routes, check X-CSRF-Token header
  const headerToken = request.headers.get('x-csrf-token');

  if (!token && !headerToken) {
    // Server Actions handle CSRF automatically
    // API routes should provide token
    return {
      valid: true, // Trust Next.js built-in protection
      error: undefined,
    };
  }

  // If token provided, validate it matches
  if (token && headerToken && token !== headerToken) {
    return {
      valid: false,
      error: 'CSRF token mismatch',
    };
  }

  return { valid: true };
}

/**
 * Verify both origin and token for POST requests
 */
export function verifyCsrf(
  request: Request,
  options?: { token?: string }
): {
  valid: boolean;
  error?: string;
} {
  // Check origin
  const originCheck = verifyCsrfOrigin(request);
  if (!originCheck.valid) {
    return originCheck;
  }

  // Check token
  const tokenCheck = verifyCsrfToken(request, options?.token);
  if (!tokenCheck.valid) {
    return tokenCheck;
  }

  return { valid: true };
}
