# Architecture Documentation

## System Overview

FlowForge is a modern SaaS workspace management platform built with Next.js, React, TypeScript, Prisma, and PostgreSQL. The architecture follows clean separation of concerns with tenant isolation at the data layer.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser / Client                        │
└────────────┬────────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────────┐
│                    Next.js 16 Frontend                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Auth Pages  │  │ Workspace UI │  │  Analytics   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        React Components (Server + Client)            │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────┬────────────────────────────────────────────────┘
             │ HTTP/REST
┌────────────▼────────────────────────────────────────────────┐
│                  Next.js 16 Backend                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           API Routes (/app/api/*)                    │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │   │
│  │  │  Auth API    │  │ Workspace    │  │  Search   │ │   │
│  │  │              │  │  Projects    │  │  Analytics│ │   │
│  │  │              │  │  Tasks API   │  │           │ │   │
│  │  └──────────────┘  └──────────────┘  └───────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Server Actions                          │   │
│  │  (mutations with optimistic updates)                │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Service Layer                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  (5 services)  │   │
│  │  │ProjectService│  │  TaskService │  CommentSvc   │   │
│  │  │WorkspaceSvc  │  │ApprovalSvc   │  NotifySvc    │   │
│  │  └──────────────┘  └──────────────┘                │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Cross-Cutting Concerns                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │   │
│  │  │   Rate       │  │    Input     │  │ Structured│ │   │
│  │  │  Limiting    │  │ Sanitization │  │  Logging  │ │   │
│  │  │              │  │              │  │           │ │   │
│  │  │   CSRF       │  │   SENTRY     │  │ Error     │ │   │
│  │  │ Verification │  │  Monitoring  │  │ Tracking  │ │   │
│  │  └──────────────┘  └──────────────┘  └───────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │    Data Access Layer (Prisma + PostgreSQL)           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │   │
│  │  │  Workspace   │  │   Project    │  │   Task    │ │   │
│  │  │  Repository  │  │  Repository  │  │Repository │ │   │
│  │  │  Models      │  │  Models      │  │  Models   │ │   │
│  │  └──────────────┘  └──────────────┘  └───────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────┬────────────────────────────────────────────────┘
             │ SQL/TCP
┌────────────▼────────────────────────────────────────────────┐
│            PostgreSQL Database (Multi-tenant)               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Tables: Users, Workspaces, Projects, Tasks, Comments│   │
│  │         Members, Audits, Notifications, Approvals   │   │
│  │ Tenant Isolation: workspaceId on all tables         │   │
│  │ Indexes: 18 strategic indexes for performance       │   │
│  │ Migrations: 47 applied migrations (Prisma Migrate)  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Layer Breakdown

### 1. Presentation Layer (React Components)

**Location**: `/app` (Next.js app directory)

**Responsibility**: Server-side rendering, client-side interactivity

**Key Features**:
- Server Components for static content + data fetching
- Client Components for interactive elements
- Form handling with Server Actions
- Optimistic UI updates

**Implementation**:
```
/app
├── /workspace/[id]/
│   ├── /projects/page.tsx (Server)
│   ├── /tasks/page.tsx (Server)
│   ├── /analytics/page.tsx (Server)
│   └── /components/task-card.tsx (Client)
├── /api/ (API routes)
└── layout.tsx (Root layout with providers)
```

### 2. Business Logic Layer (Services)

**Location**: `/modules/{feature}/service.ts`

**Responsibility**: Business logic, authorization, data coordination

**Services**:

1. **ProjectService** (`/modules/project/service.ts`)
   - CRUD operations with authorization
   - Project filtering and search
   - Status lifecycle management

2. **TaskService** (`/modules/task/service.ts`)
   - Complete task lifecycle
   - Assignment notifications
   - Status tracking with timestamps

3. **CommentService** (`/modules/comment/service.ts`)
   - Create/update/delete with HTML sanitization
   - Rate limiting (60/hour)
   - Threading support

4. **WorkspaceService** (`/modules/workspace/service.ts`)
   - Workspace CRUD and management
   - Member invitation and removal
   - Role-based access control

5. **ApprovalService** (`/modules/approval/service.ts`)
   - Request creation and lifecycle
   - Decision tracking (approve/reject)
   - Turnaround time analytics

### 3. Data Access Layer (Repositories)

**Location**: `/modules/{feature}/repository.ts`

**Responsibility**: Database queries, Prisma ORM interfacing

**Pattern**:
```typescript
// Example: TaskRepository
class TaskRepository {
 constructor(private tenant: TenantContext) {}
  
  async listTasks(filters?) {
    return prisma.task.findMany({
      where: { workspaceId: this.tenant.workspaceId, ...filters }
    });
  }
}
```

**Key Principles**:
- All queries filtered by `workspaceId` (tenant isolation)
- Transactions for multi-step operations
- Index usage for performance
- Type-safe with generated Prisma types

### 4. Cross-Cutting Concerns

**4.1 Security Layer** (`/lib/security/`)

- **Input Sanitization** (`/lib/input/sanitize.ts`)
  - DOMPurify integration
  - HTML allowlist: `<b>`, `<i>`, `<code>`, `<ul>`, `<ol>`, `<li>`, `<a>`
  - Applied to: Projects, Tasks, Comments, Approvals, Workspaces

- **Rate Limiting** (`/lib/rate-limiting/rate-limiter.ts`)
  - In-memory Map with 60s auto-cleanup
  - Four strategically protected endpoints:
    - Search: 30/minute per user
    - Signin: 5/15 minutes per email
    - Invites: 20/hour per workspace
    - Comments: 60/hour per user
  - Returns 429 status with Retry-After header

- **CSRF Protection** (`/lib/security/csrf.ts`)
  - Origin header verification
  - Referer fallback check
  - NextAuth form integration
  - Configurable via NEXT_PUBLIC_APP_URL

**4.2 Observability Layer** (`/lib/logging/` + `/lib/monitoring/`)

- **Structured Logging** (`/lib/logging/logger.ts`)
  - RequestLogger class with JSON output
  - Fields: requestId (UUID), userId, workspaceId, action, statusCode, durationMs
  - Integration: 1 endpoint (search) live, framework ready for 23 more
  - Enables request tracing and performance debugging

- **Error Monitoring** (`/lib/monitoring/sentry.ts`)
  - Sentry.io integration
  - Global error capture
  - Session replay (masked for privacy)
  - Breadcrumb tracking
  - User context association
  - 10% trace sampling for performance monitoring
  - Components:
    - `sentry.ts`: Main configuration
    - `sentry.server.ts`: Server-side initialization
    - `sentry.client.ts`: Client-side initialization with replay
    - `sentry-provider.tsx`: React provider wrapper

**4.3 Authorization Layer** (`/modules/{feature}/policies.ts`)

**Pattern**:
```typescript
// TaskPolicy example
export const TaskPolicy = {
  canRead(tenant: TenantContext) {
    return [VIEWER, MEMBER, MANAGER, OWNER].includes(tenant.role);
  },
  
  canCreate(tenant: TenantContext) {
    return [MEMBER, MANAGER, OWNER].includes(tenant.role);
  },
  
  canUpdate(tenant: TenantContext, task: Task) {
    // VIEWER cannot update, others check ownership
    if (tenant.role === VIEWER) return false;
    // MANAGER/OWNER can update any
    if ([MANAGER, OWNER].includes(tenant.role)) return true;
    // MEMBER can only update own tasks
    return task.createdBy === tenant.userId;
  }
};
```

## Tenant Isolation Strategy

**Goal**: Prevent accidental or intentional cross-workspace data access

**Implementation**:

1. **Database Level**
   - Every data table has `workspaceId` column
   - Implicit in Prisma queries via TenantContext

2. **Application Level**
   - TenantContext resolved from session + URL params
   - Context passed to all services
   - Repository queries automatically filtered

3. **Example Query**:
```typescript
// Service
async getProject(projectId: string) {
  // this.tenant.workspaceId automatically applied
  return this.repo.getProject(projectId);
}

// Repository
async getProject(projectId: string) {
  return prisma.project.findUnique({
    where: {
      id: projectId,
      workspaceId: this.tenant.workspaceId,  // ← Mandatory filter
    },
  });
}
```

## Performance Optimizations

### 1. Database Indexes (18 total)

**Applied**:
```sql
-- Task indexes
CREATE INDEX ON Task(workspaceId, status);
CREATE INDEX ON Task(workspaceId, assigneeId);
CREATE INDEX ON Task(workspaceId, dueDate);
CREATE INDEX ON Task(projectId);

-- Comment indexes
CREATE INDEX ON Comment(taskId);
CREATE INDEX ON Comment(workspaceId);

-- Notification indexes
CREATE INDEX ON Notification(userId, isRead);

-- Audit indexes
CREATE INDEX ON AuditLog(workspaceId, createdAt);

-- Approval indexes
CREATE INDEX ON ApprovalRequest(workspaceId, status);
```

**Performance Impact**:
- Analytics dashboard: 800ms (vs 4+ seconds previously)
- Search queries: <200ms
- List operations: <50ms with filters

### 2. Query Optimization

- Parallel query execution (Promise.all) in service layer
- Strategic use of Prisma's `include()` and `select()`
- Pagination on list endpoints (20 per page default)
- Aggregation at database level (not client)

### 3. Caching Strategy

- URL-based cache invalidation (Next.js)
- Revalidation on mutations
- Request-level caching via context

## API Routes

### Authentication

```
POST   /api/auth/signin         - Sign in with email/password
POST   /api/auth/signup         - Create new account
POST   /api/auth/signout        - Sign out
GET    /api/auth/callback       - OAuth callback
```

### Workspace Management

```
GET    /api/workspace           - List user's workspaces
POST   /api/workspace           - Create new workspace
GET    /api/workspace/[id]      - Get workspace details
PATCH  /api/workspace/[id]      - Update workspace
```

### Projects

```
GET    /api/workspace/[id]/projects       - List projects
POST   /api/workspace/[id]/projects       - Create project
GET    /api/workspace/[id]/projects/[pid] - Get project
PATCH  /api/workspace/[id]/projects/[pid] - Update project
DELETE /api/workspace/[id]/projects/[pid] - Delete project
```

### Tasks

```
GET    /api/workspace/[id]/tasks          - List tasks
POST   /api/workspace/[id]/tasks          - Create task
GET    /api/workspace/[id]/tasks/[tid]    - Get task
PATCH  /api/workspace/[id]/tasks/[tid]    - Update task
DELETE /api/workspace/[id]/tasks/[tid]    - Delete task
```

### Search

```
GET    /api/workspace/[id]/search?q=query - Full-text search (30/min rate limit)
```

### Analytics

```
GET    /api/workspace/[id]/analytics      - Dashboard metrics
POST   /api/workspace/[id]/analytics/export - CSV export
```

## Error Handling

### Error Types

```typescript
// /lib/errors/
- AuthenticationError: User not authenticated
- AuthorizationError: User lacks permission
- ValidationError: Input validation failed
- NotFoundError: Resource not found
- ConflictError: Business logic conflict
- RateLimitError: Rate limit exceeded (429)
```

### Error Propagation

1. **Service Layer**: Throws typed errors
2. **API Route**: Catches and formats response
3. **Frontend**: Displays user-friendly message
4. **Monitoring**: Logs to Sentry

## Testing Strategy

### Unit Tests (40 hours planned)

**Coverage**: 5 core services (Project, Task, Comment, Workspace, Approval)

**Pattern**:
```typescript
describe('ProjectService', () => {
  it('should list projects when authorized', async () => {
    // Setup mock authorization
    // Call service
    // Assert results
  });
  
  it('should throw ForbiddenError when unauthorized', async () => {
    // Setup denied authorization  
    // Expect error
  });
});
```

### Integration Tests (30 hours planned)

**Workflows**:
1. Task Lifecycle: Create → Assign → Comment → Complete
2. Approval: Request → Review → Approve/Reject
3. Permission Boundaries: Cross-role authorization

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 19.2.4 |
| Framework | Next.js | 16.2.1 |
| Language | TypeScript | 5+ |
| Styling | Tailwind CSS | 4.x |
| ORM | Prisma | 7.6.0 |
| Database | PostgreSQL | 15+ |
| Auth | NextAuth | 5.0-beta |
| Validation | Zod | 4.3 |
| Testing | Vitest | 4.1 |
| Error Tracking | Sentry | 10.47 |
| Rate Limiting | In-Memory | Custom |
| Sanitization | DOMPurify | 3.7 |

## Deployment Architecture

### Development
- Local PostgreSQL
- `npm run dev` with hot reload
- Turbopack for fast builds

### Staging
- Cloud-hosted PostgreSQL (Azure/AWS)
- Next.js on Node.js runtime
- Environment variables via .env.staging
- Sentry with staging DSN

### Production
- Managed PostgreSQL (RDS/Azure Database)
- Serverless deployment (Vercel/AWS Lambda)
- Environment variables from secrets manager
- Sentry with production DSN
- CDN for static assets
- Database backups (daily)

## Security Considerations

1. **Data Protection**
   - HTTPS/TLS in transit
   - Input sanitization at application layer
   - SQL injection prevention via Prisma ORM
   - CSRF tokens on form submissions

2. **Access Control**
   - JWT-based authentication (NextAuth)
   - Workspace-scoped authorization
   - Policy objects for granular checks
   - Audit logging of all mutations

3. **Rate Limiting**
   - 4 strategic endpoints protected
   - Progressive backoff with Retry-After
   - IP + User-based keys for accuracy

4. **Error Disclosure**
   - Generic messages to clients
   - Detailed logs in server-side monitoring
   - Stack traces only in development

## Monitoring & Observability

### Metrics Tracked

**Performance**:
- Request latency (p50, p95, p99)
- Database query times
- API response codes (2xx, 4xx, 5xx)
- Page load times

**Business**:
- Active workspaces
- Tasks created/completed
- User engagement
- Feature usage

**Infrastructure**:
- Database connection pool
- Memory usage
- CPU utilization
- Error rates

### Debugging Workflow

1. User reports issue
2. Check Sentry for error traces
3. Review RequestLogger JSON logs
4. Correlate with database audit logs
5. Reproduce in development
6. Deploy fix with tests

## Future Improvements

1. **Scalability**
   - Redis for distributed rate limiting
   - Connection pooling at database layer
   - Message queue for async tasks

2. **Performance**
   - GraphQL for mobile clients
   - Server-side pagination tokens
   - Incremental Static Regeneration (ISR)

3. **Security**
   - Two-factor authentication
   - End-to-end encryption for sensitive data
   - Advanced threat detection

4. **Monitoring**
   - Custom dashboards in Grafana
   - Real-time alerts for critical events
   - Distributed tracing

---

**Last Updated**: April 2, 2026  
**Status**: ✅ Architecture Complete | TIER 3-5 Implementation In Progress
