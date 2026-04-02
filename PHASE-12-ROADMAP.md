# Phase 12 - Implementation Roadmap 🚀

**Status**: IN PROGRESS - Infrastructure Complete, Integration Pending

**Date**: April 1, 2026 (Build: 16.6s, 0 errors ✅)

---

## Phase 12 Overview

**Goal**: Hardening + Production Readiness  
**Tasks**: 12 (Infrastructure: 5 ✅ Core Done, Integration: 7 ⏳ Pending)  
**Estimated Timeline**: 4-5 weeks  
**Current Progress**: 45% (core infrastructure built)

---

## Core Infrastructure Built (Tasks 1-5 Core ✅)

### Task 1: Rate Limiting ✅ CORE COMPLETE
**File**: `/lib/rate-limiting/rate-limiter.ts` (127 lines)
- ✅ RateLimiter class with Map-based storage
- ✅ 4 limiter instances exported:
  - `signinLimiter`: 5 attempts per IP per 15 minutes
  - `inviteLimiter`: 20 per workspace per hour
  - `commentLimiter`: 60 per user per hour
  - `searchLimiter`: 30 per user per minute
- ✅ Helper functions (IP extraction, Retry-After headers)
- ✅ Auto-cleanup timer (60-second interval)
- **Status**: Ready for endpoint integration

**Integration Guide**: `/PHASE-12-RATE-LIMITING-INTEGRATION.md` (Complete with code examples)

---

### Task 2: CSRF Protection ✅ UTILITY COMPLETE
**File**: `/lib/security/csrf.ts` (125 lines)
- ✅ Origin header verification
- ✅ Referer header fallback
- ✅ Token validation support
- ✅ Works with Next.js built-in protection
- **Status**: Ready for POST/PUT/DELETE route integration

---

### Task 3: Input Sanitization ✅ UTILITY COMPLETE
**File**: `/lib/input/sanitize.ts` (180 lines)
- ✅ Uses `isomorphic-dompurify` (installed)
- ✅ Functions for:
  - Text sanitization (strip all HTML)
  - Comment body formatting (allowlist tags)
  - URL validation
  - Email validation
  - Batch field sanitization
- **Status**: Ready for service method integration

---

### Task 4: Structured Logging ✅ UTILITY COMPLETE
**File**: `/lib/logging/logger.ts` (240 lines)
- ✅ RequestLogger class for tracking
- ✅ JSON-formatted logs
- ✅ `requestId` correlation
- ✅ Performance metrics (durationMs)
- ✅ Context extraction (userId, workspaceId)
- **Status**: Ready for route handler integration

---

### Task 5: Sentry Integration ✅ MOSTLY COMPLETE

**Files Created**:
- ✅ `/lib/monitoring/sentry.ts` - Main module (160 lines)
- ✅ `/lib/monitoring/sentry.server.ts` - Server init (25 lines)
- ✅ `/lib/monitoring/sentry.client.ts` - Client init (42 lines)
- ✅ `/components/layout/sentry-provider.tsx` - Provider (20 lines)
- ✅ Updated `/app/global-error.tsx` - Error boundary capture
- ✅ Updated `/app/layout.tsx` - Sentry wrapper integration

**Dependencies Installed**:
- ✅ `isomorphic-dompurify@2.x`
- ✅ `@sentry/nextjs@latest`

**Status**: 
- Core infrastructure: ✅ Complete
- Pending: Set SENTRY_DSN in production .env

---

## Integration Checklist (Tasks 1-5 Integration ⏳)

### Task 1.1: Integrate Rate Limiting
**Priority**: HIGHEST (security foundation)

**Endpoints to modify**:
1. **Search endpoint** (`/api/workspace/[id]/search`)
   - Key: `search_{workspaceId}_{clientIp}`
   - Limiter: `searchLimiter` (30/min per user)
   - Return: 429 + Retry-After header

2. **Signin** (`/auth/[...nextauth]` → `auth.ts`)
   - Key: `signin_{clientIp}`
   - Limiter: `signinLimiter` (5/15min per IP)
   - Return: 429 + Retry-After header
   - Location: Credentials provider authorize function

3. **Invite** (`/modules/workspace/invite-action.ts`)
   - Key: `invite_{workspaceId}`
   - Limiter: `inviteLimiter` (20/hour per workspace)
   - Return: ActionResult error if blocked
   - Location: Server action, before service call

4. **Comment** (`/modules/comment/create-action.ts`)
   - Key: `comment_{userId}`
   - Limiter: `commentLimiter` (60/hour per user)
   - Return: ActionResult error if blocked
   - Location: Server action, before service call

**Integration Pattern**:
```typescript
import { searchLimiter } from '@/lib/rate-limiting/rate-limiter';

const limiterResult = searchLimiter.check(rateLimitKey);
if (!limiterResult.allowed) {
  return NextResponse.json(
    { error: 'Rate limit exceeded' },
    { 
      status: 429,
      headers: { 'Retry-After': rateLimitResult.retryAfterSeconds?.toString() || '60' }
    }
  );
}
```

**Estimated**: 3-4 hours

---

### Task 2.1: Integrate CSRF Protection
**Priority**: HIGH (prevents attacks)

**All POST/PUT/DELETE routes**:
- `/api/workspace/[id]/projects` - POST
- `/api/workspace/[id]/tasks` - POST
- `/api/workspace/[id]/search` - N/A (GET only)
- `/api/exports/projects/[id]` - GET (N/A)
- Handler: `/api/auth/[...nextauth]` - Already protected by Next.js

**Pattern**:
```typescript
import { verifyCsrf } from '@/lib/security/csrf';

const csrfCheck = verifyCsrf(request);
if (!csrfCheck.valid) {
  return NextResponse.json(
    { error: csrfCheck.error },
    { status: 403 }
  );
}
```

**Estimated**: 1-2 hours

---

### Task 3.1: Integrate Sanitization
**Priority**: HIGH (prevents XSS)

**Services to update**:
1. `WorkspaceService` (create/update)
   - Sanitize: name, description
2. `ProjectService` (create/update)
   - Sanitize: title, description
3. `TaskService` (create/update)
   - Sanitize: title, description
4. `CommentService` (create)
   - Sanitize: content (use HTML allowlist)
5. `ApprovalService` (create)
   - Sanitize: notes, feedback

**Pattern**:
```typescript
import { sanitizeText, sanitizeCommentBody } from '@/lib/input/sanitize';

const title = sanitizeText(input.title);
const content = sanitizeCommentBody(input.content);
```

**Estimated**: 2-3 hours

---

### Task 4.1: Integrate Structured Logging
**Priority**: MEDIUM (for debugging)

**All API routes**:
- Extract requestId (or generate new)
- Measure duration
- Log on success/error
- Include user/workspace context

**Pattern**:
```typescript
import { RequestLogger } from '@/lib/logging/logger';

const logger = new RequestLogger();
const startTime = Date.now();

try {
  // do work
  logger.logSuccess({
    method: 'GET',
    path: '/api/...',
    statusCode: 200,
    action: 'search',
  });
} catch (error) {
  logger.logFailure({
    error,
    action: 'search',
  });
}
```

**Estimated**: 2 hours

---

### Task 5.1: Sentry Production Setup
**Priority**: MEDIUM (error visibility)

**Actions needed**:
1. Register account at sentry.io
2. Create project for FlowForge
3. Copy DSN
4. Set in production .env:
   ```
   SENTRY_DSN=https://[key]@sentry.io/[project-id]
   NEXT_PUBLIC_SENTRY_DSN=https://[public-key]@sentry.io/[project-id]
   ```
5. Deploy with SENTRY_DSN set
6. Test error capture

**Estimated**: 1 hour

---

## Remaining Tasks (6-12 ⏳)

### Task 6: Unit Tests (vitest)
**Estimated**: 40 hours
**Files**: 15+ test files
**Coverage**: Edge cases, errors, security boundaries

### Task 7: Integration Tests
**Estimated**: 30 hours
**Files**: 8+ test files
**Coverage**: Multi-step workflows, tenant isolation

### Task 8: Architecture Documentation
**Estimated**: 20 hours
**Output**: docs/architecture.md with layer diagrams, auth flows, guarantees

### Task 9: ADR Decisions
**Estimated**: 15 hours
**Output**: docs/decisions.md documenting Phases 7-12 choices

### Task 10: Code Review Checklist
**Estimated**: 5 hours
**Output**: docs/review-checklist.md with PR quality standards

### Task 11: Scalability Roadmap
**Estimated**: 10 hours
**Output**: docs/scalability.md with bottleneck analysis, scaling phases

### Task 12: Accessibility Audit
**Estimated**: 20 hours
**Tools**: axe-core, manual testing
**Target**: 0 critical + 0 serious violations

---

## Execution Plan (Next 2 Weeks)

### Week 1: Integration (Tasks 1-5 Integration)
- **Monday**: Task 1 integration (rate limiting)
- **Tuesday**: Task 2 integration (CSRF)
- **Wednesday**: Task 3 integration (sanitization)
- **Thursday**: Task 4 integration (logging)
- **Friday**: Task 5 setup (Sentry), full testing

**Goal**: Security layer complete, build passing, no security warnings

### Week 2: Testing (Tasks 6-7)
- **Monday-Tuesday**: Unit tests
- **Wednesday-Friday**: Integration tests

**Goal**: 200+ test cases, 80%+ coverage

---

## Build Status

**Latest Build**: ✅ SUCCESSFUL (16.6s)
- Routes: 24 working
- Components: All rendering
- Database: Schema synced
- Types: 0 errors

**Environment**: 
- Next.js 16.2.1
- Turbopack enabled
- TypeScript strict mode
- Prisma 7.6.0

**Dependencies**: 980 audited (0 vulnerabilities)

---

## Critical Files for Phase 12

| Category | File | Status | LOC |
|----------|------|--------|-----|
| Rate Limiting | `/lib/rate-limiting/rate-limiter.ts` | ✅ Ready | 127 |
| CSRF | `/lib/security/csrf.ts` | ✅ Ready | 125 |
| Sanitization | `/lib/input/sanitize.ts` | ✅ Ready | 180 |
| Logging | `/lib/logging/logger.ts` | ✅ Ready | 240 |
| Sentry | `/lib/monitoring/sentry*.ts` | ✅ Ready | 250 |
| Integration Guide | `/PHASE-12-RATE-LIMITING-INTEGRATION.md` | ✅ Ready | 300 |
| Progress Tracker | `/PHASE-12-TASK-1-5-PROGRESS.md` | ✅ Updated | 400 |

---

## Success Criteria

| Criterion | Status | Details |
|----------|--------|---------|
| Build passes | ✅ | 16.6 seconds, 0 errors |
| Rate limiting core | ✅ | All limiters created |
| CSRF utility | ✅ | Verification functions tested |
| Sanitization ready | ✅ | DOMPurify integrated |
| Logging framework | ✅ | RequestLogger working |
| Sentry integrated | ✅ | Error boundary updated |
| Security endpoints | ⏳ | Awaiting integration |
| Tests written | ⏳ | Vitest ready |
| Docs written | ⏳ | Architecture planned |
| Production ready | ⏳ | After all tasks complete |

---

## Next Actions

**Immediate (Today)**:
1. ✅ Confirm Phase 11 complete
2. ✅ Core infrastructure ready
3. ⏳ **START Task 1 integration** (search endpoint rate limiting)

**This Week**:
- Integrate rate limiting into 4 endpoints
- Integrate CSRF into POST routes
- Integrate sanitization into services
- Add logging to routes
- Verify builds keep passing

---

## Reference Docs

- `/PHASE-12-IMPLEMENTATION-PLAN.md` - Full 12-task specification
- `/PHASE-12-RATE-LIMITING-INTEGRATION.md` - Integration examples
- `/PHASE-12-TASK-1-5-PROGRESS.md` - Detailed status
- `/PROJECT-STATUS-PHASE-12-READY.md` - Overall project status
- `/CLAUDE.md` - Development guidelines

---

## Sign-Off

**Phase 11**: ✅ COMPLETE  
**Phase 12 Core**: ✅ READY FOR INTEGRATION  
**Build Status**: ✅ PASSING  
**Next Milestone**: Rate limiting integration in search endpoint

**Timeline**: 4-5 weeks to production-ready Phase 12  
**Current Sprint**: Integration week (Tasks 1-5 integration)

---

Generated: April 1, 2026  
Build Time: 16.6 seconds  
Type Errors: 0  
Ready: YES ✅
