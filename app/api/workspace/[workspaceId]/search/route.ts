import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/require-user';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { SearchService } from '@/modules/search/service';
import { searchLimiter, getClientIp, getRetryAfterHeader } from '@/lib/rate-limiting/rate-limiter';
import { verifyCsrf } from '@/lib/security/csrf';
import { RequestLogger } from '@/lib/logging/logger';
import { z } from 'zod';

const searchSchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

/**
 * Global search endpoint
 * GET /api/workspace/[workspaceId]/search?q=query&limit=20
 * 
 * Security:
 * - Rate limiting: 30 searches per minute per user
 * - CSRF verification
 * - Auth required
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const logger = new RequestLogger();
  const startTime = Date.now();
  
  try {
    const { workspaceId } = await params;
    const clientIp = getClientIp(request);

    // Auth check
    const user = await requireUser();
    if (!user) {
      logger.logFailure({
        error: new Error('Unauthorized'),
        action: 'search',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Set logging context
    logger.setContext(user.id, workspaceId);

    // Rate limit check (30 per minute per user)
    const limitResult = searchLimiter.check(user.id);
    if (!limitResult.allowed) {
      logger.logFailure({
        error: new Error('Rate limit exceeded'),
        action: 'search',
      });
      return NextResponse.json(
        { error: 'Too many search requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': getRetryAfterHeader(limitResult.retryAfterSeconds || 60),
          },
        }
      );
    }

    // CSRF verification
    const csrfCheck = verifyCsrf(request);
    if (!csrfCheck.valid) {
      logger.logFailure({
        error: new Error(`CSRF validation failed: ${csrfCheck.error}`),
        action: 'search',
      });
      return NextResponse.json(
        { error: 'CSRF validation failed' },
        { status: 403 }
      );
    }

    // Tenant check
    const tenant = await resolveTenantContext(workspaceId, user.id);
    if (!tenant) {
      logger.logFailure({
        error: new Error('Workspace not found or access denied'),
        action: 'search',
      });
      return NextResponse.json({ error: 'Workspace access denied' }, { status: 403 });
    }

    // Validation
    const { searchParams } = new URL(request.url);
    const parseResult = searchSchema.safeParse({
      q: searchParams.get('q'),
      limit: searchParams.get('limit'),
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: parseResult.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    // Search
    const service = new SearchService(tenant);
    const results = await service.globalSearch(parseResult.data.q, parseResult.data.limit);

    // Log success
    logger.logSuccess({
      method: 'GET',
      path: `/api/workspace/${workspaceId}/search`,
      statusCode: 200,
      action: 'search',
    });

    return NextResponse.json({
      data: results,
      query: parseResult.data.q,
    });
  } catch (error) {
    logger.logFailure({ error: error as Error, action: 'search' });
    console.error('[Search API]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
