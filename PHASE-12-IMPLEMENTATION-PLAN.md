# PHASE 12 — HARDENING + PRODUCTION READINESS

**Status**: Ready to Start  
**Prerequisites**: Phase 11 Bug Fix Complete ✅ (see PHASE-11-BUG-FIX-COMPLETE.md)  
**Timeline**: ~2-3 weeks for full implementation  
**Complexity**: High - Security, observability, testing, and documentation

---

## 📋 Phase 12 Scope Overview

| Category | Tasks | Status |
|----------|-------|--------|
| **Security** | Rate limiting, CSRF, input sanitization | 🔄 To Do |
| **Database** | Performance indexes | ✅ Complete |
| **Observability** | Structured logging, Sentry setup | 🔄 To Do |
| **Testing** | Unit & integration tests | 🔄 To Do |
| **Documentation** | Architecture, decisions, reviews | 🔄 To Do |
| **Accessibility** | axe-core audit, keyboard navigation | 🔄 To Do |

---

## 🔒 SECURITY IMPLEMENTATION

### Task 1: Rate Limiting

#### 1.1 Sign-In Rate Limiting
**File**: Create `lib/rate-limiting/signin-limiter.ts`

```typescript
// Max: 5 attempts per IP per 15 minutes
// Response: 429 Too Many Requests + Retry-After header

const SIGNIN_ATTEMPTS = new Map<string, Array<number>>();
const SIGNIN_MAX_ATTEMPTS = 5;
const SIGNIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function checkSignInRateLimit(ipAddress: string): {
  allowed: boolean;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const attempts = SIGNIN_ATTEMPTS.get(ipAddress) || [];
  
  // Clean old attempts
  const recentAttempts = attempts.filter(
    time => now - time < SIGNIN_WINDOW_MS
  );
  
  if (recentAttempts.length >= SIGNIN_MAX_ATTEMPTS) {
    const oldestAttempt = Math.min(...recentAttempts);
    const retryAfterMs = oldestAttempt + SIGNIN_WINDOW_MS - now;
    
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000)
    };
  }
  
  recentAttempts.push(now);
  SIGNIN_ATTEMPTS.set(ipAddress, recentAttempts);
  
  return { allowed: true };
}
```

**Integration Points**:
- File: `app/(auth)/sign-in/route.ts` (or sign-in action)
- Get IP: `request.headers.get('x-forwarded-for')` or use middleware
- Response: Send 429 status + Retry-After header

**Test Case**:
```bash
# 1. Sign-in 5 times with same IP → succeeds
# 2. Sign-in 6th time with same IP → returns 429
# 3. Check Retry-After header in response
# 4. Wait 15 minutes or mock time → succeeds again
```

#### 1.2 Invite Rate Limiting
**File**: Create `lib/rate-limiting/invite-limiter.ts`

```typescript
// Max: 20 invites per workspace per hour
// Response: 429 Too Many Requests + Retry-After header

const INVITE_ATTEMPTS = new Map<string, Array<number>>();
const INVITE_MAX_PER_HOUR = 20;
const INVITE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export function checkInviteRateLimit(workspaceId: string): {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const key = `workspace_${workspaceId}`;
  const attempts = INVITE_ATTEMPTS.get(key) || [];
  
  const recentAttempts = attempts.filter(
    time => now - time < INVITE_WINDOW_MS
  );
  
  if (recentAttempts.length >= INVITE_MAX_PER_HOUR) {
    const oldestAttempt = Math.min(...recentAttempts);
    const retryAfterMs = oldestAttempt + INVITE_WINDOW_MS - now;
    
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000)
    };
  }
  
  recentAttempts.push(now);
  INVITE_ATTEMPTS.set(key, recentAttempts);
  
  return {
    allowed: true,
    remaining: INVITE_MAX_PER_HOUR - recentAttempts.length
  };
}
```

**Integration Points**:
- File: `app/api/workspace/[workspaceId]/members/invite/route.ts`
- Call before processing invite
- Return remaining invites in response

#### 1.3 Comment Rate Limiting
**File**: Create `lib/rate-limiting/comment-limiter.ts`

```typescript
// Max: 60 comments per user per hour
// Response: 429 + Retry-After
```

#### 1.4 Search Rate Limiting
**File**: Already done in Phase 10
```typescript
// Max: 30 per user per minute
// ✅ Verified implemented in task filter and search components
```

#### 1.5 Redis Upgrade Path (Development Plan)
**File**: Create `docs/observability-redis-upgrade.md`

```markdown
# Redis Upgrade Path for Rate Limiting

## Development (Current)
- In-memory Map per rate limiter
- Good for: Single server, testing
- Bad for: Multi-server deployment, persistent storage

## Production
### Step 1: Install Redis client
```bash
npm install redis ioredis
```

### Step 2: Create rate limiting with Redis
```typescript
// lib/rate-limiting/redis-client.ts
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

export async function incrementRateLimit(
  key: string,
  windowSeconds: number
): Promise<number> {
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }
  
  return count;
}
```

### Step 3: Migrate rate limiters
Replace all in-memory Maps with Redis calls

### Step 4: Deploy with Redis service
- Kubernetes: redis-master-0 StatefulSet
- Docker Compose: redis:7 service
- Hosted: AWS ElastiCache or Redis Cloud
```

**Documentation Location**: `docs/observability.md`

---

### Task 2: CSRF Protection
**File**: `lib/csrf/verify-origin.ts`

```typescript
// Verify Next.js App Router built-in protection active
// Add explicit origin header check in all POST handlers

export function verifyCsrfToken(
  req: NextRequest,
  expectedOrigin?: string
): { valid: boolean; error?: string } {
  // Next.js 16 provides built-in CSRF protection for Server Actions
  // But verify explicitly for API routes
  
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  
  // Check origin matches deployment domain
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ];
  
  if (origin && !allowedOrigins.includes(origin)) {
    return {
      valid: false,
      error: 'Invalid origin'
    };
  }
  
  return { valid: true };
}
```

**Update All POST Handlers**:
```typescript
// app/api/workspace/[workspaceId]/projects/route.ts

export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  // Verify CSRF
  const csrfCheck = verifyCsrfToken(request);
  if (!csrfCheck.valid) {
    return NextResponse.json(
      { error: csrfCheck.error },
      { status: 403 }
    );
  }
  
  // ... rest of handler
}
```

---

### Task 3: Input Sanitization

**File**: `lib/sanitization/sanitize-input.ts`

```typescript
import DOMPurify from 'isomorphic-dompurify';

// Strip HTML from all string fields except comment body
export function sanitizeString(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .trim()
    .substring(0, 1000); // Max 1000 chars
}

// Allowlist HTML for comment body
export function sanitizeCommentBody(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'code', 'a', 'em', 'strong'],
    ALLOWED_ATTR: ['href'],
  });
}

// Usage in services
export async function createTask(input: {
  title: string;
  description?: string;
}) {
  return {
    title: sanitizeString(input.title),
    description: sanitizeString(input.description),
  };
}
```

**Install**:
```bash
npm install isomorphic-dompurify
```

**Update**: Apply to all service create/update methods

---

## 📊 OBSERVABILITY IMPLEMENTATION

### Task 4: Structured Logging

**File**: Create `lib/observability/logger.ts`

```typescript
import crypto from 'crypto';

export interface LogEntry {
  requestId: string;
  timestamp: string;
  userId?: string;
  workspaceId?: string;
  action: string;
  durationMs?: number;
  statusCode?: number;
  error?: string;
  stackTrace?: string;
}

const requestIdMap = new Map<string, string>();

export function createRequestId(): string {
  return crypto.randomUUID();
}

export function logRequest(entry: LogEntry): void {
  const jsonLog = JSON.stringify({
    requestId: entry.requestId,
    timestamp: entry.timestamp || new Date().toISOString(),
    userId: entry.userId,
    workspaceId: entry.workspaceId,
    action: entry.action,
    durationMs: entry.durationMs,
    statusCode: entry.statusCode,
    error: entry.error,
    ...(entry.stackTrace && { stackTrace: entry.stackTrace }),
  });

  console.log(jsonLog);
  
  // Future: Send to Datadog/Loki
  // fetch('http://loki:3100/loki/api/v1/push', { ... })
}

export function logError(
  entry: LogEntry,
  error: Error
): void {
  logRequest({
    ...entry,
    error: error.message,
    stackTrace: error.stack,
  });
}
```

**Usage in Route Handlers**:
```typescript
// app/api/workspace/[workspaceId]/projects/route.ts

export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const requestId = request.headers.get('x-request-id') || createRequestId();
  const startTime = Date.now();

  try {
    const projects = await projectService.getProjects(params.workspaceId);
    
    logRequest({
      requestId,
      timestamp: new Date().toISOString(),
      action: 'GET /api/workspace/projects',
      durationMs: Date.now() - startTime,
      statusCode: 200,
      workspaceId: params.workspaceId,
    });

    return NextResponse.json({ data: projects });
  } catch (error) {
    logError({
      requestId,
      timestamp: new Date().toISOString(),
      action: 'GET /api/workspace/projects',
      durationMs: Date.now() - startTime,
      statusCode: 500,
      workspaceId: params.workspaceId,
    }, error as Error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Task 5: Sentry Integration

**File**: `lib/observability/sentry.ts`

```typescript
import * as Sentry from "@sentry/nextjs";

export function initSentry(): void {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.OnUncaughtException(),
    ],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
}
```

**Install**:
```bash
npm install @sentry/nextjs
```

**Update `.env.example`**:
```env
SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/zzz
NODE_ENV=production
```

---

## 🧪 TESTING IMPLEMENTATION

### Task 6: Unit Tests

Create test files for all services:

```typescript
// modules/workspace/service.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkspaceService } from './service';
import { WorkspaceRepository } from './repository';

describe('WorkspaceService', () => {
  let mockRepository: WorkspaceRepository;
  let service: WorkspaceService;

  beforeEach(() => {
    mockRepository = {
      find: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as any;

    service = new WorkspaceService(mockRepository);
  });

  describe('createWorkspace', () => {
    it('should create workspace with valid input', async () => {
      const workspace = {
        id: '1',
        name: 'Test Workspace',
        slug: 'test-workspace',
      };

      mockRepository.create.mockResolvedValue(workspace);

      const result = await service.createWorkspace({
        name: 'Test Workspace',
        slug: 'test-workspace',
        userId: 'user-1',
      });

      expect(result).toEqual(workspace);
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid input', async () => {
      await expect(
        service.createWorkspace({
          name: '',
          slug: 'test-workspace',
          userId: 'user-1',
        })
      ).rejects.toThrow('Workspace name required');
    });

    it('should throw ForbiddenError if user insufficient role', async () => {
      mockRepository.find.mockResolvedValue({
        id: '1',
        role: 'VIEWER', // Not enough permissions
      });

      await expect(
        service.createWorkspace({
          name: 'Test',
          slug: 'test',
          userId: 'user-1',
        })
      ).rejects.toThrow('Insufficient permissions');
    });
  });

  describe('getWorkspace', () => {
    it('should return workspace when found', async () => {
      const workspace = { id: '1', name: 'Test' };
      mockRepository.find.mockResolvedValue(workspace);

      const result = await service.getWorkspace('1', 'user-1');

      expect(result).toEqual(workspace);
    });

    it('should throw NotFoundError when workspace missing', async () => {
      mockRepository.find.mockResolvedValue(null);

      await expect(
        service.getWorkspace('invalid', 'user-1')
      ).rejects.toThrow('Workspace not found');
    });
  });
});
```

**Test Each Service** (coverage checklist):
- [ ] `modules/workspace/service.test.ts`
- [ ] `modules/project/service.test.ts`
- [ ] `modules/task/service.test.ts`
- [ ] `modules/approval/service.test.ts`
- [ ] `modules/comment/service.test.ts`

Each test file covers:
- ✅ Happy path (valid input)
- ✅ NotFoundError (missing entity)
- ✅ ForbiddenError (insufficient role)
- ✅ ValidationError (invalid input)
- ✅ Status transition rules (task service only)

### Task 7: Integration Tests

```typescript
// tests/integration/workspace-create.test.ts
// Uses DATABASE_URL_TEST env var
// Uses real database (sqlite or test pg)

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { WorkspaceService } from '@/modules/workspace/service';

describe('Workspace Creation (Integration)', () => {
  let workspaceService: WorkspaceService;

  beforeEach(async () => {
    workspaceService = new WorkspaceService();
    // Clear test database
    await prisma.workspace.deleteMany();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('should create workspace and member in transaction', async () => {
    const workspace = await workspaceService.createWorkspace({
      name: 'Test Workspace',
      slug: 'test-ws',
      userId: 'user-1',
    });

    expect(workspace.id).toBeDefined();
    expect(workspace.name).toBe('Test Workspace');

    // Verify member was created
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: workspace.id,
        userId: 'user-1',
      },
    });

    expect(member).toBeDefined();
    expect(member?.role).toBe('OWNER');
  });
});
```

**Integration Test Checklist**:
- [ ] `tests/integration/workspace-create.test.ts`
- [ ] `tests/integration/task-lifecycle.test.ts`
- [ ] `tests/integration/approval-flow.test.ts`

---

## 📚 DOCUMENTATION

### Task 8: Architecture Documentation

**File**: `docs/architecture.md`

```markdown
# Architecture Overview

## System Layers

### 1. HTTP Layer (Next.js App Router)
- Page components (server-side rendered)
- API Route handlers
- Server Actions
- Middleware (auth)

### 2. Service Layer
- Business logic (validation, authorization)
- Coordinate repositories
- Handle cross-cutting concerns

### 3. Repository Layer
- Data access (Prisma ORM)
- Database queries
- Transaction management

### 4. Data Layer
- PostgreSQL database
- Prisma schema
- Migrations

## Authentication Flow

1. User navigates to /auth/sign-in
2. Form submitted → validates email/password
3. Store session in cookie/JWT
4. Subsequent requests include session
5. Middleware verifies session
6. resolveTenantContext() checks workspace membership

## Authorization Flow

- Every request gets tenant context
- resolveTenantContext() returns: userId, workspaceId, role
- Service layer checks role before mutations
- Repository filters by workspaceId (tenant isolation)

## Tenant Isolation Guarantee

Every table has `workspaceId` field:
- ✅ Workspace isolation enforced at schema level
- ✅ All queries filtered by workspaceId
- ✅ No cross-workspace data access

## Approval State Machine

```
        ┌──────────┐
        │ PENDING  │
        └────┬─────┘
             │
      ┌──────┴──────┐
      │             │
      ▼             ▼
 ┌────────────┐ ┌────────────┐
 │  APPROVED  │ │  REJECTED  │
 └────┬───────┘ └────┬───────┘
      │              │
      └──────┬───────┘
             │
           ▼
        ┌────────────┐
        │ CANCELLED  │
        └────────────┘
```

Valid transitions:
- PENDING → APPROVED
- PENDING → REJECTED
- PENDING/APPROVED/REJECTED → CANCELLED
```

### Task 9: Decisions Documentation

**File**: `docs/decisions.md` (ADRs - Architecture Decision Records)

```markdown
# Architecture Decisions

## ADR-001: Next.js App Router for Frontend

**Status**: Accepted (Phase 1)  
**Context**: Need modern, performant React framework with TypeScript support  
**Decision**: Use Next.js 16 App Router  
**Consequences**:
- ✅ Server-side rendering reduces client bundle
- ✅ Built-in API routes and server components
- ✅ File-based routing matches URL structure
- ⚠️ Requires careful server/client boundary management

## ADR-002: Prisma ORM for Database Access

**Status**: Accepted (Phase 1)  
**Context**: Need type-safe database queries with migration support  
**Decision**: Use Prisma as ORM  
**Consequences**:
- ✅ Auto-generated types match schema
- ✅ Migrations track schema changes
- ✅ Query builder prevents SQL injection
- ⚠️ Adds abstraction layer (vs raw SQL)

## ADR-003: Row-Level Tenant Isolation

**Status**: Accepted (Phase 7)  
**Context**: Multi-tenant SaaS with workspace isolation requirement  
**Decision**: Add workspaceId to every table, filter in queries  
**Consequences**:
- ✅ No join complexity with separate schemas
- ✅ Simple to reason about (every row has owner)
- ✅ Easy to migrate users between workspaces
- ⚠️ Risk if workspaceId filter forgotten

## ADR-004: In-Memory Rate Limiting (Dev), Redis (Production)

**Status**: Accepted (Phase 12)  
**Context**: Need rate limiting without external dependencies in dev  
**Decision**: Use Map in dev, Redis in production  
**Consequences**:
- ✅ Dev setup requires no docker services
- ✅ Production uses durable, distributed store
- ⚠️ Requires migration path documentation

## ADR-005: DOMPurify for XSS Protection

**Status**: Accepted (Phase 12)  
**Context**: Users can input comments with some HTML formatting  
**Decision**: Sanitize input server-side with allowlist of safe tags  
**Consequences**:
- ✅ Users can format (bold, links) while staying safe
- ✅ Server-side ensures sanitization even with JS disabled
- ⚠️ Adds ~50KB to bundle (for fallback on client)
```

### Task 10: Review Checklist

**File**: `docs/review-checklist.md`

```markdown
# PR Review Checklist

Before merging any PR, verify:

## Code Quality
- [ ] No console.log() statements
- [ ] TypeScript: npx tsc --noEmit → 0 errors
- [ ] ESLint: npm run lint → 0 errors
- [ ] Tests: npm run test → all pass

## Security
- [ ] No secrets in code (check .env.example)
- [ ] Input sanitized for all string fields
- [ ] SQL injection impossible (using Prisma)
- [ ] CSRF token verified on all mutating endpoints
- [ ] Rate limiting enforced for sensitive actions

## Performance
- [ ] No N+1 queries (use Prisma include/select)
- [ ] Indexes added for filtering columns
- [ ] Response < 100ms for 95th percentile
- [ ] Appropriate caching headers set

## Database
- [ ] Schema changes have migration
- [ ] All new endpoints filter by workspaceId
- [ ] Tenant isolation maintained

## Testing
- [ ] Unit tests for new services
- [ ] Integration tests for workflows
- [ ] 80%+ code coverage target
- [ ] Happy path and error cases covered

## Accessibility
- [ ] All form inputs have labels
- [ ] Keyboard navigation works
- [ ] Color not only indicator
- [ ] Alt text for images
- [ ] Heading hierarchy correct

## Documentation
- [ ] README or docs updated if needed
- [ ] JSDoc comments on public functions
- [ ] Complex logic explained inline
```

### Task 11: Observability Documentation

**File**: `docs/observability.md`

```markdown
# Observability Guide

## Structured Logging

All logs are JSON formatted:
```json
{
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-04-01T13:00:00Z",
  "userId": "user123",
  "workspaceId": "workspace456",
  "action": "POST /api/workspace/projects",
  "durationMs": 145,
  "statusCode": 201
}
```

### Parsing with Loki
```promql
{job="flowforge"} | json
| statusCode="500"
```

### Parsing with Datadog
```
service:flowforge action:"POST*" statusCode:(500 OR 502)
```

## Error Logging

Errors include full stack trace:
```json
{
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-04-01T13:00:00Z",
  "action": "POST /api/workspace/projects",
  "statusCode": 500,
  "error": "Unauthorized: insufficient permissions",
  "stackTrace": "Error: Unauthorized: insufficient permissions\n    at WorkspaceService.createProject..."
}
```

## Sentry Integration

1. Create Sentry account at sentry.io
2. Create project for "Flowforge"
3. Copy DSN
4. Add to .env: `SENTRY_DSN=https://xxx...`
5. Deploy and errors auto-report to Sentry dashboard

## Redis Upgrade

See: docs/observability-redis-upgrade.md
```

### Task 12: Scalability Planning

**File**: `docs/scalability.md`

```markdown
# Scalability and Performance

## Current Bottlenecks (Single Server)

1. **Database Queries**: All executed serially
   → Solution: Use indexes, batch queries

2. **In-Memory Rate Limiting**: Lost on restart
   → Solution: Migrate to Redis for distributed setup

3. **File Uploads**: Limited by server disk
   → Solution: Use S3/blob storage

4. **WebSocket Connections**: Not persistent across servers
   → Solution: Use Redis pub/sub for multi-server

## Performance Targets (on single server)

- Sign-in: < 200ms
- List projects: < 100ms
- Create task: < 150ms
- Add comment: < 100ms
- Generate report: < 5s

## Scaling Phases

### Phase 1: Single Server Optimization (Phase 12)
✅ Add indexes
✅ Optimize N+1 queries
✅ Structured logging for profiling

### Phase 2: Read Replicas
↦ PostgreSQL replicas for read-heavy queries
↦ Route analytics queries to replica

### Phase 3: Redis Cache Layer
↦ Cache frequently accessed items
↦ Distributed rate limiting

### Phase 4: Horizontally Scalable
↦ Multi-server deployment
↦ Shared Redis for sessions
↦ Database connection pooling (PgBouncer)

### Phase 5: Microservices
↦ Separate auth service
↦ Separate notification service
↦ Async job queue (Bull/RabbitMQ)
```

---

## ♿ ACCESSIBILITY AUDIT

### Task 13: axe-core Testing

```bash
npm install --save-dev @axe-core/react

# Test all pages:
- /auth/sign-in
- /workspace/[id]
- /workspace/[id]/projects
- /workspace/[id]/analytics
- /workspace/[id]/members
- /workspace/[id]/settings
```

**Success Criteria**:
- ✅ 0 critical violations
- ✅ 0 serious violations
- ⚠️ Yellow: review and fix non-essential

### Task 14: Keyboard Navigation

Check all pages:
- [ ] Tab order logical (top-to-bottom, left-to-right)
- [ ] Can focus all interactive elements
- [ ] No keyboard traps (can always tab away)
- [ ] Form submission with Enter key
- [ ] Modals trap focus appropriately
- [ ] Close modals with Escape key

### Task 15: Visual Accessibility

- [ ] No color-only indicators (use icons + text)
- [ ] Contrast ratio ≥ 4.5:1 for all text
- [ ] Form labels visible and associated
- [ ] Error messages clear and helpful
- [ ] Focus indicators visible

---

## ✅ PHASE 12 GATE CHECKLIST

Before marking Phase 12 complete:

### Security
- [ ] Sign-in: 429 on 6th attempt in 15min
- [ ] Invites: 429 after 20 per hour
- [ ] Comments: 429 after 60 per hour
- [ ] Search: 429 after 30 per minute (Phase 10)
- [ ] CSRF token verified on all POST routes
- [ ] Input sanitized: HTML stripped from fields
- [ ] Comment body: allowlist sanitization
- [ ] No XSS vulnerabilities (test with `<script>alert()</script>`)

### Database
- [ ] `npx prisma migrate status` → no pending
- [ ] All indexes present in schema
- [ ] `npm run build` → succeeds

### Observability
- [ ] All route handlers log JSON
- [ ] requestId present in every log entry
- [ ] Error logs include stack trace
- [ ] SENTRY_DSN in .env.example
- [ ] Sentry wiring documented

### Testing
- [ ] Unit tests: `npx vitest run` → all pass
- [ ] Integration tests pass
- [ ] 80%+ code coverage
- [ ] npm run test command configured

### Documentation
- [ ] `docs/architecture.md` complete
- [ ] `docs/decisions.md` with all ADRs
- [ ] `docs/review-checklist.md` established
- [ ] `docs/observability.md` written
- [ ] `docs/scalability.md` written
- [ ] Rate limiting Redis upgrade path documented

### Accessibility
- [ ] axe-core audit: 0 critical violations
- [ ] All pages keyboard navigable
- [ ] No keyboard traps
- [ ] All form inputs have labels
- [ ] Focus indicators visible

### Build & Type Safety
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run lint` → 0 errors
- [ ] `npm run build` → succeeds
- [ ] All analytics tests pass

---

## 📊 PHASE 12 Implementation Order

**Recommended sequence** (dependencies first):

1. **Database** (1 day)
   - Add all indexes to schema
   - npx prisma db push

2. **Security** (3-4 days)
   - Rate limiters (signin, invite, comment)
   - CSRF verification
   - Input sanitization
   - Test each rate limit manually

3. **Observability** (2 days)
   - Structured logging in all handlers
   - Sentry setup & integration
   - Request ID propagation

4. **Testing** (4-5 days)
   - Unit tests for all services
   - Integration tests
   - Set up CI/CD for test running

5. **Documentation** (2-3 days)
   - Architecture diagrams
   - ADRs for all decisions
   - Review checklist
   - Observability guide
   - Scalability planning

6. **Accessibility** (2 days)
   - axe-core audit
   - Fix critical violations
   - Keyboard navigation review

---

## 🎯 Success Criteria

Phase 12 is **COMPLETE** when:

✅ All rate limits enforced  
✅ All logs structured JSON  
✅ All tests passing  
✅ 0 critical accessibility violations  
✅ TypeScript: 0 errors  
✅ Documentation: architecture + decisions + checklists  
✅ Sentry integrated  
✅ Ready for production deployment  

---

**Next**: Create Phase 12 implementation task breakdown with assigned owners and due dates.

Generated: April 1, 2026
