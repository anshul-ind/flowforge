# Architecture Decision Records (ADRs)

## ADR-001: Server Components vs Client Components Strategy

**Status**: ✅ ACCEPTED (Phase 1)

**Context**: Next.js 13+ supports server components by default, enabling data fetching directly in components and reducing client-side JavaScript.

**Decision**: Use Server Components by default; Client Components only when interaction is required.

**Pattern**:
```typescript
// Server Component (default)
export default async function WorkspacePage({ params }) {
  const workspace = await getWorkspace(params.id);
  return <WorkspaceUI workspace={workspace} />;
}

// Client Component (for interactivity)
'use client';
export function EditButton({ workspaceId }) {
  const [isEditing, setIsEditing] = useState(false);
  return <button onClick={() => setIsEditing(!isEditing)}>Edit</button>;
}
```

**Benefits**:
- Reduced bundle size
- Secure API key usage server-side
- Faster initial page load
- Built-in data fetching

**Tradeoffs**:
- Cannot use hooks in server components
- More structure required for interactive features

---

## ADR-002: Tenant Isolation at Data Layer

**Status**: ✅ ACCEPTED (Phase 2)

**Context**: Multi-tenant SaaS requires strict isolation per workspace to prevent data leakage.

**Decision**: Enforce `workspaceId` filter on every database query as implicit requirement.

**Implementation**:
```typescript
// TenantContext passed to all services
class ProjectRepository {
  constructor(private tenant: TenantContext) {}
  
  // ALWAYS filter by workspaceId
  async getProject(id: string) {
    return prisma.project.findUnique({
      where: {
        id,
        workspaceId: this.tenant.workspaceId, // ← MANDATORY
      },
    });
  }
}
```

**Verification**: Code review checklist item #3 - "Verify workspaceId filter on all queries"

**Benefits**:
- No possibility of cross-tenant leakage (at DB level)
- Audit trail via workspaceId on every row
- Clear responsibility assignment

**Tradeoffs**:
- Slightly more verbose queries
- Testing requires multiple workspaces

---

## ADR-003: Input Sanitization with DOMPurify

**Status**: ✅ ACCEPTED (Phase 12)

**Context**: User-generated content (tasks, comments) can contain malicious scripts. Need to prevent XSS while allowing rich formatting.

**Decision**: Use DOMPurify with configurable HTML allowlist. Sanitize at service layer before persistence.

**Configuration**:
```typescript
// /lib/input/sanitize.ts
const ALLOWED_TAGS = ['b', 'i', 'u', 'code', 'ul', 'ol', 'li', 'a'];
const ALLOWED_ATTRS = ['href', 'target'];

export function sanitizeCommentBody(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ALLOWED_ATTRS,
  });
}
```

**Applied To**:
- Projects: name, description
- Tasks: title, description
- Comments: htmlContent (with formatting)
- Approvals: title, notes
- Workspaces: name

**Testing**:
```typescript
it('should block script injection', () => {
  const malicious = '<img src=x onerror="alert(1)">';
  const clean = sanitizeText(malicious);
  expect(clean).not.toContain('onerror');
});
```

**Benefits**:
- Prevents DOM-based XSS attacks
- Allows markdown-like formatting
- Database stores clean HTML
- Client can safely render

---

## ADR-004: Rate Limiting Strategy

**Status**: ✅ ACCEPTED (Phase 12)

**Context**: Protect endpoints from abuse and DoS attacks. Need simple, stateless solution without external dependencies initially.

**Decision**: In-memory Map-based rate limiter with configurable limits per endpoint.

**Implementation**:
```typescript
// /lib/rate-limiting/rate-limiter.ts
class RateLimiter {
  private attempts = new Map<string, number[]>(); // timestamp array per key
  
  check(key: string): { allowed: boolean; remaining: number; retryAfterSeconds?: number } {
    const now = Date.now();
    const limits = (this.attempts.get(key) || [])
      .filter((ts) => now - ts < this.windowMs); // 60s window
    
    if (limits.length >= this.maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil((limits[0] + this.windowMs - now) / 1000),
      };
    }
    
    this.attempts.set(key, [...limits, now]);
    return { allowed: true, remaining: this.maxAttempts - limits.length };
  }
}

// 4 instances for different endpoints
export const searchLimiter = new RateLimiter(30, 60 * 1000); // 30/minute
export const signinLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5/15min
export const inviteLimiter = new RateLimiter(20, 60 * 60 * 1000); // 20/hour
export const commentLimiter = new RateLimiter(60, 60 * 60 * 1000); // 60/hour
```

**Endpoint Integration**:
```typescript
// app/api/workspace/[id]/search/route.ts
const limit = searchLimiter.check(`user-${userId}`);
if (!limit.allowed) {
  return NextResponse.json(
    { error: 'Too many requests' },
    {
      status: 429,
      headers: { 'Retry-After': limit.retryAfterSeconds?.toString() },
    }
  );
}
```

**Future Enhancement**: Redis integration for distributed deployments

**Benefits**:
- No external service dependency
- Fast in-memory lookups
- Per-user and per-workspace keys

**Tradeoffs**:
- Not distributed (single server only)
- Memory grows with active users
- Auto-cleanup every 60s

---

## ADR-005: Structured JSON Logging

**Status**: ✅ ACCEPTED (Phase 12)

**Context**: Need to understand request flow, performance, and errors in production. Text logs don't enable structured querying.

**Decision**: Implement RequestLogger class with JSON output containing request ID, user context, duration, and result.

**Format**:
```json
{
  "timestamp": "2026-04-02T10:30:45.123Z",
  "requestId": "uuid-here",
  "userId": "user-123",
  "workspaceId": "ws-456",
  "action": "search",
  "method": "GET",
  "path": "/api/workspace/ws-456/search",
  "query": { "q": "task title" },
  "statusCode": 200,
  "durationMs": 145,
  "tags": ["search", "production"],
  "error": null
}
```

**Implementation**:
```typescript
class RequestLogger {
  private requestId = crypto.randomUUID();
  
  setContext(userId: string, workspaceId: string) {
    this.userId = userId;
    this.workspaceId = workspaceId;
  }
  
  logSuccess(data: { method, path, statusCode, action, tags }) {
    console.log(JSON.stringify({ ...data, requestId: this.requestId }));
  }
}
```

**Usage Pattern**:
```typescript
// Per endpoint
const logger = new RequestLogger();
logger.setContext(userId, workspaceId);
// ... do work ...
logger.logSuccess({ method: 'GET', path, statusCode: 200, action: 'fetch_tasks' });
```

**Benefits**:
- Enables correlation via requestId
- Machine-readable for aggregation
- Easy to parse in log aggregators (ELK, CloudWatch)
- Supports performance analysis

**Tradeoffs**:
- Slightly more verbose than text logs
- Requires structured log parsing

---

## ADR-006: Error Tracking with Sentry

**Status**: ✅ ACCEPTED (Phase 12)

**Context**: Production errors need visibility, stack traces, and user context. Cannot rely on logs alone.

**Decision**: Integrate Sentry.io for error capture, session replay, and alerting.

**Configuration**:
```typescript
// lib/monitoring/sentry.ts
export async function initializeSentry() {
  return Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1, // 10% of requests
    integrations: [
      new Sentry.Replay({ maskAllText: true, blockAllMedia: true }),
    ],
  });
}

// Server-side init
import * as Sentry from '@sentry/nextjs';
Sentry.init({ ... });

// Client-side init
'use client';
import * as Sentry from '@sentry/nextjs';
Sentry.init({ ... });
```

**User Context**:
```typescript
Sentry.setUserContext({
  id: userId,
  email: userEmail,
  workspace: workspaceId,
});
```

**Benefits**:
- Real-time error notifications
- Stack traces with source maps
- Session replay for debugging
- Performance monitoring

**Tradeoffs**:
- Third-party dependency
- Privacy considerations (session replay)
- Cost at scale

---

## ADR-007: Service-Level Authorization Policies

**Status**: ✅ ACCEPTED (Phase 5)

**Context**: Authorization rules are scattered and inconsistent. Need centralized, testable authorization logic.

**Decision**: Implement Policy objects per service containing authorization rules.

**Pattern**:
```typescript
// modules/task/policies.ts
export const TaskPolicy = {
  canRead(tenant: TenantContext): boolean {
    return [VIEWER, MEMBER, MANAGER, OWNER].includes(tenant.role);
  },
  
  canCreate(tenant: TenantContext): boolean {
    return [MEMBER, MANAGER, OWNER].includes(tenant.role);
  },
  
  canUpdate(tenant: TenantContext, task: Task): boolean {
    if (tenant.role === VIEWER) return false;
    if (tenant.role === OWNER) return true;
    if (tenant.role === MANAGER) return true;
    // Member can only update own tasks
    return task.createdBy === tenant.userId;
  },
  
  canDelete(tenant: TenantContext, task: Task): boolean {
    return [OWNER, MANAGER].includes(tenant.role);
  },
};

// Usage in service
async updateTask(taskId: string, data: any) {
  const task = await this.repo.getTask(taskId);
  
  if (!TaskPolicy.canUpdate(this.tenant, task)) {
    throw new ForbiddenError('Cannot update task');
  }
  
  return this.repo.updateTask(taskId, data);
}
```

**Benefits**:
- Centralized authorization logic
- Easy to test
- Clear for code review
- Reusable across endpoints

---

## ADR-008: Service Layer vs Direct Repository Access

**Status**: ✅ ACCEPTED (Phase 1)

**Context**: Should authorization and business logic be in services or routes?

**Decision**: All business logic and authorization goes in Service layer. Routes call services. Repositories handle only data access.

**Structure**:
```
REQUEST → API ROUTE → SERVICE → REPOSITORY → DATABASE
                ↓        ↓          ↓
            Parsing   Auth/Logic   Data
            Format    Validation   Access
            Response  Transform
```

**Benefits**:
- Services are testable without HTTP
- Authorization is centralized
- Logic is reusable across endpoints
- Clear separation of concerns

---

## ADR-009: Async Notifications via Service

**Status**: ✅ ACCEPTED (Phase 8)

**Context**: Notifications trigger from multiple actions (task assigned, approval requested, comment added). Need to prevent blocking mutations.

**Decision**: Notification service called asynchronously after mutations complete. Errors don't block main operation.

**Implementation**:
```typescript
// TaskService
async updateTask(taskId: string, data: any) {
  const task = await this.repo.updateTask(taskId, data);
  
  // Fire-and-forget notification
  this.notifyTaskAssignment(task).catch(err => {
    logger.error('Notification failed', { taskId, error: err });
    // Don't block mutation on notification failure
  });
  
  return task;
}

// Async handler
private async notifyTaskAssignment(task: Task) {
  // Create notification record asynchronously
  await this.notificationService.createNotification({
    type: 'TASK_ASSIGNED',
    recipientId: task.assigneeId,
    taskId: task.id,
  });
}
```

**Benefits**:
- Mutations complete quickly
- Notification failures don't block users
- Can scale notifications independently

---

## ADR-010: Workspace Slug vs UUID Routing

**Status**: ✅ ACCEPTED (Phase 2)

**Context**: Should URLs use human-readable slugs (`/workspace/acme-corp`) or UUIDs (`/workspace/123e4567`)?

**Decision**: Use UUIDs internally (workspaceId) with optional slug display. Slugs are indexed but not primary keys.

**Schema**:
```prisma
model Workspace {
  id    String @id @default(cuid())        // Primary key (routing)
  slug  String @unique                      // Human-readable (display only)
  name  String
}
```

**Routing**:
```typescript
// /app/workspace/[workspaceId]/projects/page.tsx
export default async function ProjectsPage({ params }) {
  // params.workspaceId is UUID
  const workspace = await resolveWorkspace(params.workspaceId);
  return <ProjectsList workspace={workspace} />;
}
```

**Benefits**:
- Stable URLs (slug changes don't break links)
- UUID uniqueness guaranteed
- Security through obscurity (IDs not sequential)
- Slug can be customized without refactor

---

## ADR-011: Pagination Strategy

**Status**: ✅ ACCEPTED (Phase 3)

**Context**: List endpoints need pagination. Cursor-based vs offset-based?

**Decision**: Offset-based with page size limit (20 default, max 100).

**API**:
```typescript
GET /api/workspace/[id]/tasks?page=1&limit=20&sort=-dueDate
```

**Response**:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

**Benefits**:
- Simple to understand and implement
- Works with traditional UI patterns
- Database agnostic

**Tradeoffs**:
- Can be unstable with concurrent inserts
- Alternative: Use cursor-based for very large datasets

---

## ADR-012: Soft Deletes vs Hard Deletes

**Status**: ✅ ACCEPTED (Phase 4)

**Context**: Deleted data needed for audit trail. Keep in database but mark as deleted?

**Decision**: Soft deletes. Add `deletedAt` nullable field. Filter in all queries.

**Schema**:
```prisma
model Task {
  id        String
  title     String
  deletedAt DateTime?
  
  @@index([workspaceId, deletedAt])
}
```

**Usage**:
```typescript
// Always filter out deleted records
async listTasks() {
  return prisma.task.findMany({
    where: {
      workspaceId: this.tenant.workspaceId,
      deletedAt: null, // Only non-deleted
    },
  });
}

// Soft delete
async deleteTask(id: string) {
  return prisma.task.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
```

**Benefits**:
- Preserved audit trail
- Can undelete if needed
- GDPR compliance (with separate hard delete process)

---

## Future ADRs to Document

- ADR-013: Caching Strategy (Redis vs In-Memory)
- ADR-014: GraphQL vs REST API
- ADR-015: Microservices vs Monolith
- ADR-016: Message Queue for Background Jobs
- ADR-017: Search Index (PostgreSQL FTS vs Elasticsearch)

---

**Last Updated**: April 2, 2026  
**Status**: 12 ADRs Documented | ✅ COMPLETE FOR PHASE 12
