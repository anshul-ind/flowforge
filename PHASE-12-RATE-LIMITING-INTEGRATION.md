/**
 * Phase 12 Task 1 - Rate Limiting Integration Guide
 * 
 * This guide explains how to integrate the rate limiter across:
 * 1. API Routes (direct integration)
 * 2. Server Actions (via X-Client-IP header)
 * 3. NextAuth signin (via middleware)
 * 
 * Pattern for all routes:
 * 1. Extract the rate limit key (IP for signin, userId for others)
 * 2. Call limiter.check(key)
 * 3. Return 429 if !allowed
 * 4. Log the rate limit event
 */

// ================================================================
// PART 1: API ROUTE INTEGRATION - Search endpoint
// ================================================================

// Integration in: /app/api/workspace/[workspaceId]/search/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/require-user';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { SearchService } from '@/modules/search/service';
import { searchLimiter, getClientIp, getRetryAfterHeader } from '@/lib/rate-limiting/rate-limiter';
import { logRequest, logError, RequestLogger } from '@/lib/logging/logger';
import { z } from 'zod';

const searchSchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const logger = new RequestLogger();
  const startTime = Date.now();

  try {
    // Get client IP for rate limiting
    const clientIp = getClientIp(request);
    const rateLimitKey = `search_${params.workspaceId}_${clientIp}`;

    // Check rate limit
    const rateLimitResult = searchLimiter.check(rateLimitKey);
    if (!rateLimitResult.allowed) {
      logRequest({
        requestId: logger.getRequestId(),
        method: 'GET',
        path: `/api/workspace/${params.workspaceId}/search`,
        statusCode: 429,
        durationMs: Date.now() - startTime,
        action: 'search',
        tags: {
          reason: 'rate_limit_exceeded',
          remaining: rateLimitResult.remaining.toString(),
        },
      });

      return NextResponse.json(
        {
          error: 'Too many search requests',
          retryAfter: rateLimitResult.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': getRetryAfterHeader(
              rateLimitResult.retryAfterSeconds || 60
            ),
            'X-RateLimit-Limit': '30',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          },
        }
      );
    }

    // Auth check
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Tenant check
    const tenant = await resolveTenantContext(params.workspaceId, user.id);
    if (!tenant) {
      return NextResponse.json({ error: 'Workspace access denied' }, { status: 403 });
    }

    logger.setContext(user.id, params.workspaceId);

    // Validation
    const { searchParams } = new URL(request.url);
    const parseResult = searchSchema.safeParse({
      q: searchParams.get('q'),
      limit: searchParams.get('limit'),
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: parseResult.error.errors },
        { status: 422 }
      );
    }

    // Search
    const service = new SearchService(tenant);
    const results = await service.globalSearch(parseResult.data.q, parseResult.data.limit);

    logger.logSuccess({
      method: 'GET',
      path: `/api/workspace/${params.workspaceId}/search`,
      statusCode: 200,
      action: 'search',
    });

    return NextResponse.json({
      data: results,
      query: parseResult.data.q,
    });
  } catch (error) {
    logger.logFailure({
      error: error as Error,
      action: 'search',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ================================================================
// PART 2: SERVER ACTION INTEGRATION - Invite & Comments
// ================================================================

// For server actions, use a middleware approach:
// 1. Create middleware that extracts client IP and sets X-Client-IP header
// 2. In server action, read the header and apply rate limit
// 3. Return error response if rate limited

// File: /middleware.ts
/*
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Only process API and action routes
  if (request.nextUrl.pathname.startsWith('/api') || 
      request.nextUrl.pathname.startsWith('/') && request.method === 'POST') {
    
    // Extract client IP
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    
    // Set header for server actions to access
    const response = NextResponse.next();
    response.headers.set('x-client-ip', clientIp);
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
*/

// In server action: /modules/workspace/invite-action.ts
/*
export async function inviteMemberAction(
  workspaceId: string,
  input: unknown
): Promise<ActionResult<WorkspaceMember>> {
  try {
    // Get session
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'You must be logged in' };
    }

    // Rate limiting
    const rateLimitKey = `invite_${workspaceId}`;
    const rateLimitResult = inviteLimiter.check(rateLimitKey);
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        message: `Too many invitations. Please wait ${rateLimitResult.retryAfterSeconds} seconds`,
      };
    }

    // ... rest of invite logic
  }
}
*/

// ================================================================
// PART 3: NEXTAUTH SIGNIN INTEGRATION
// ================================================================

// For NextAuth, integrate rate limiting in the credentials authorize function
// File: /auth.ts

/*
import { signinLimiter, getClientIp } from '@/lib/rate-limiting/rate-limiter';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        clientIp: { label: 'Client IP', type: 'hidden' }, // Passed from form
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Rate limit by IP
        const clientIp = credentials.clientIp as string || 'unknown';
        const rateLimitKey = `signin_${clientIp}`;
        const rateLimitResult = signinLimiter.check(rateLimitKey);

        if (!rateLimitResult.allowed) {
          // Log rate limit event
          console.warn(`[Auth] Signin rate limit exceeded for IP ${clientIp}`);
          throw new Error(
            `Too many login attempts. Please try again in ${rateLimitResult.retryAfterSeconds} seconds`
          );
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            select: { id: true, email: true, name: true, passwordHash: true },
          });

          if (!user?.passwordHash) {
            // Still count as attempt
            return null;
          }

          const isValidPassword = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          );

          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  // ... rest of config
});
*/

// ================================================================
// TESTING RATE LIMITERS
// ================================================================

// Unit test pattern for rate limiters

/*
import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter } from '@/lib/rate-limiting/rate-limiter';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({ maxAttempts: 5, windowMs: 60000 });
  });

  it('allows requests under the limit', () => {
    for (let i = 0; i < 5; i++) {
      const result = limiter.check('test_key');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5 - i - 1);
    }
  });

  it('blocks requests over the limit', () => {
    for (let i = 0; i < 5; i++) {
      limiter.check('test_key');
    }

    const result = limiter.check('test_key');
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('resets counter after time window expires', () => {
    limiter = new RateLimiter({ maxAttempts: 2, windowMs: 100 }); // 100ms window
    
    limiter.check('test_key');
    limiter.check('test_key');
    
    // Both should be blocked
    let result = limiter.check('test_key');
    expect(result.allowed).toBe(false);

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 150));

    result = limiter.check('test_key');
    expect(result.allowed).toBe(true);
  });
});
*/

// ================================================================
// MONITORING RATE LIMITERS
// ================================================================

// Check limiter stats
/*
// In any route or action
import { 
  signinLimiter, 
  inviteLimiter, 
  commentLimiter, 
  searchLimiter 
} from '@/lib/rate-limiting/rate-limiter';

// Get current state
console.log('Signin limiter stats:', signinLimiter.getStats());
console.log('Invite limiter stats:', inviteLimiter.getStats());
console.log('Search limiter stats:', searchLimiter.getStats());

// Reset specific key (for testing)
signinLimiter.reset('signin_192.168.1.1');

// Clear all entries
signinLimiter.clear();
*/

// ================================================================
// MIGRATION TO REDIS (Future)
// ================================================================

// When scaling to multiple servers,migrate to Redis:

/*
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
});

export class RedisRateLimiter {
  constructor(
    private redis: Redis,
    private maxAttempts: number,
    private windowMs: number
  ) {}

  async check(key: string) {
    const current = await this.redis.incr(`rate-limit:${key}`);
    
    if (current === 1) {
      await this.redis.expire(`rate-limit:${key}`, Math.ceil(this.windowMs / 1000));
    }

    const remaining = Math.max(0, this.maxAttempts - current);
    const allowed = current <= this.maxAttempts;
    
    let ttl = 0;
    if (!allowed) {
      ttl = await this.redis.ttl(`rate-limit:${key}`);
    }

    return {
      allowed,
      remaining,
      retryAfterSeconds: ttl > 0 ? ttl : undefined,
    };
  }
}
*/

export {};
