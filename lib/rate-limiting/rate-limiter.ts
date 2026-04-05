/**
 * Rate Limiting Infrastructure
 * In-memory Map for development; Redis for production
 * 
 * Supports:
 * - Sign-in: max 5 attempts per IP per 15 minutes
 * - Invites: max 20 per workspace per hour
 * - Comments: max 60 per user per hour
 * - Search: max 30 per user per minute
 */

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    // Clean up expired entries every 60 seconds
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if action is allowed and increment counter
   */
  check(key: string): {
    allowed: boolean;
    remaining: number;
    retryAfterSeconds?: number;
  } {
    const now = Date.now();
    const entry = this.store.get(key);

    // Entry expired or doesn't exist
    if (!entry || now > entry.resetAt) {
      this.store.set(key, {
        count: 1,
        resetAt: now + this.config.windowMs,
      });

      return {
        allowed: true,
        remaining: this.config.maxAttempts - 1,
      };
    }

    // Within limit
    if (entry.count < this.config.maxAttempts) {
      entry.count++;
      return {
        allowed: true,
        remaining: this.config.maxAttempts - entry.count,
      };
    }

    // Over limit
    const retryAfterMs = entry.resetAt - now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  /**
   * Reset counter for a key (for testing or manual override)
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear entire store (for testing)
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get stats (for debugging/monitoring)
   */
  getStats(): { totalKeys: number; entries: Record<string, unknown> } {
    const entries: Record<string, unknown> = {};
    for (const [key, entry] of this.store.entries()) {
      entries[key] = {
        count: entry.count,
        resetAt: new Date(entry.resetAt).toISOString(),
      };
    }
    return {
      totalKeys: this.store.size,
      entries,
    };
  }
}

// Create limiters for each action
export const signinLimiter = new RateLimiter({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
});

/** Sign-up attempts per normalized email (reduces scripted account creation). */
export const signupLimiter = new RateLimiter({
  maxAttempts: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
});

export const inviteLimiter = new RateLimiter({
  maxAttempts: 20,
  windowMs: 60 * 60 * 1000, // 1 hour
});

export const commentLimiter = new RateLimiter({
  maxAttempts: 60,
  windowMs: 60 * 60 * 1000, // 1 hour
});

export const searchLimiter = new RateLimiter({
  maxAttempts: 30,
  windowMs: 60 * 1000, // 1 minute
});

/**
 * Helper to extract IP address from request
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
  return ip;
}

/**
 * Format retry header
 */
export function getRetryAfterHeader(seconds: number): string {
  return Math.max(1, Math.ceil(seconds)).toString();
}
