# Architecture Overview

## Project Structure

FlowForge is a multi-tenant project management SaaS built with Next.js 15, Prisma, and PostgreSQL.

---

## Core Principles

### 1. Multi-Tenancy (Tenant Isolation)
- Every tenant-owned resource has a `workspaceId` foreign key
- Database-level isolation prevents cross-tenant data leaks
- All queries are workspace-scoped by design

### 2. Role-Based Access Control
- Roles are **workspace-scoped**, not global
- User can have different roles in different workspaces
- Role is stored in `WorkspaceMember` junction table

### 3. Type Safety
- TypeScript everywhere
- Zod for runtime validation
- Prisma for type-safe database queries

---

## Authentication & Authorization (Phase 3)

### **Auth.js Foundation**
- **Library:** Auth.js v4 (NextAuth.js)
- **Strategy:** JWT sessions (stateless)
- **Provider:** Credentials (email/password)
- **Middleware:** Route protection at edge

### **Session Helpers (`lib/auth`)**
```typescript
// Optional auth check
const session = await getSession();
if (!session) return <LoginPrompt />;

// Enforced auth check (auto-redirects)
const user = await requireUser();
// User guaranteed to be authenticated here
```

### **Tenant Resolution (`lib/tenant`)**
```typescript
// Check workspace membership at runtime
const tenant = await resolveTenantContext(workspaceId);
if (!tenant) return <AccessDenied />;

// tenant.userId, tenant.workspaceId, tenant.role
```

### **Middleware Protection**
- Runs BEFORE any route renders
- Protects `/workspace/*` routes
- Redirects unauthenticated users to `/sign-in`
- Preserves intended destination in callback URL

### **Protected Route Behavior**
1. **Unauthenticated** → Middleware redirects to `/sign-in` (401)
2. **Authenticated, not a member** → `resolveTenantContext()` returns null (403)
3. **Authenticated, member, low role** → Role check in action/page (403)

### **TenantContext Object**
```typescript
type TenantContext = {
  userId: string;        // Who is making the request
  workspaceId: string;   // Which workspace they're accessing
  role: WorkspaceRole;   // Their role in this workspace
  requestId?: string;    // Optional tracing ID
};
```

**Why a single context object?**
- Type safety (can't forget userId, workspaceId, or role)
- Consistency (same structure everywhere)
- Extensibility (easy to add permissions, metadata)
- Clarity (these values logically belong together)

### **Service Layer (Future)**
Services will receive `TenantContext` ensuring all operations are workspace-scoped:
```typescript
// Future pattern
export class ProjectService {
  constructor(private tenant: TenantContext) {}
  
  async createProject(data: CreateProjectInput) {
    return db.project.create({
      data: { ...data, workspaceId: this.tenant.workspaceId }
    });
  }
}
```

---

## Database Schema

### Core Entities

**Global Models:**
- `User` - Authentication and profile (no global role)
- `Workspace` - Tenant root entity

**Tenant-Owned Models** (all have `workspaceId`):
- `WorkspaceMember` - User membership with role
- `Project` - Workspace projects
- `Task` - Project tasks
- `TaskDependency` - Task relationships (self-referential)
- `Comment` - Task comments
- `ApprovalRequest` - Task approval workflow
- `Notification` - User notifications per workspace
- `AuditLog` - Workspace activity audit trail

### Enums
- `WorkspaceRole` - OWNER, MANAGER, MEMBER, VIEWER
- `ProjectStatus` - PLANNED, ACTIVE, ON_HOLD, COMPLETED, ARCHIVED
- `TaskStatus` - BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED
- `TaskPriority` - LOW, MEDIUM, HIGH, URGENT
- `ApprovalStatus` - PENDING, APPROVED, REJECTED, CANCELLED
- `NotificationType` - TASK_ASSIGNED, USER_MENTIONED, APPROVAL_REQUESTED, etc.
- `AuditAction` - PROJECT_CREATED, TASK_UPDATED, APPROVAL_APPROVED, etc.

---

## Tenant Isolation Strategy

### Why `workspaceId` Everywhere?

```typescript
// ✅ Safe: Tenant boundary enforced
async function getProjects(workspaceId: string) {
  return db.project.findMany({
    where: { workspaceId }
  });
}

// ❌ Dangerous: No tenant check
async function getProject(projectId: string) {
  return db.project.findUnique({
    where: { id: projectId }
  });
}
```

### Repository Pattern (Future)

All data access will be workspace-scoped:

```typescript
// repositories/project.repository.ts
export class ProjectRepository {
  constructor(private workspaceId: string) {}

  async findAll() {
    return db.project.findMany({
      where: { workspaceId: this.workspaceId }
    });
  }

  async findById(projectId: string) {
    return db.project.findUnique({
      where: { 
        id: projectId,
        workspaceId: this.workspaceId // Always scoped!
      }
    });
  }
}
```

---

## Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling (future)

### Backend
- **Next.js Server Actions** - Type-safe mutations
- **Prisma** - Type-safe ORM
- **PostgreSQL** - Production database
- **Zod** - Runtime validation

### Infrastructure
- Database migrations via Prisma Migrate
- Singleton Prisma Client pattern for HMR safety
- Structured error handling with `ActionResult<T>`

---

## Data Flow

### Server Actions Pattern

```typescript
// app/actions/project.actions.ts
'use server';

import { db } from '@/lib/db';
import { parseFormData } from '@/lib/validation/parse';
import { successResult, errorResult } from '@/types/action-result';

export async function createProject(formData: FormData) {
  // 1. Parse and validate
  const result = parseFormData(createProjectSchema, formData);
  if (!result.success) return result;

  // 2. Authorization check (future)
  const workspaceId = await getCurrentWorkspaceId();
  
  // 3. Database operation
  const project = await db.project.create({
    data: {
      ...result.data,
      workspaceId, // Always tenant-scoped!
    }
  });

  // 4. Return structured result
  return successResult(project, 'Project created successfully');
}
```

---

## Phase-5: Shared Patterns

**See [phase-5-architecture.md](./phase-5-architecture.md) for comprehensive patterns.**

Phase-5 defines the standard structure for all modules:

```
modules/[domain]/
├── schemas.ts       # Zod validation (single source of truth)
├── policies.ts      # Authorization rules per role
├── repository.ts    # Database access (workspace-scoped)
├── service.ts       # Business logic + authorization
├── types.ts         # TypeScript interfaces
└── [action].ts      # Server actions using service layer
```

**Standard Request Flow (Mutations):**
```
Page → Action → parseFormData() → resolveTenantContext() 
  → Service → Repository → Database
```

**Key Rules:**
- ✅ Validate input with Zod in `parseFormData()`
- ✅ Resolve tenant in action/route handler
- ✅ Create service with `TenantContext`
- ✅ Check authorization in service
- ✅ Use repository for data access (workspace-scoped)
- ❌ Never call db directly from action
- ❌ Never skip authorization checks
- ❌ Never scope by `userId` alone (must include `workspaceId`)

---

## Phase-6: Read-Only Workspace & Project Shell

Phase-6 implements the foundational navigation and read-only display for workspaces and projects. No mutations are included.

### Read Data Flow Architecture

```
Server Component (Page/Layout)
  ↓ requireUser() [enforce authentication]
  ↓ resolveTenantContext(workspaceId) [enforce membership]
  ↓ Service.method(tenant) [fetch with authorization]
  ↓ Repository.method() [database query, workspace-scoped]
  ↓ Presentational Component [receive typed props, display only]
```

### Layout Organization

**Workspace layout hierarchy:**
```
app/(dashboard)/layout.tsx          [requireUser - enforce auth]
  └── app/workspace/[workspaceId]/layout.tsx  [resolveTenantContext - enforce membership]
        ├── app/workspace/[workspaceId]/page.tsx                [workspace overview]
        ├── app/workspace/[workspaceId]/projects/page.tsx       [project list]
        └── app/workspace/[workspaceId]/project/[projectId]/layout.tsx  [project detail]
```

**Key Pattern:**
- Tenant context resolved in **layout** (not page)
- All child pages assume tenant is valid
- `error.tsx` catches `ForbiddenError` from layout
- `loading.tsx` shows skeleton during data fetch

### Workspace Page Flow

```typescript
// app/workspace/[workspaceId]/layout.tsx
export default async function WorkspaceLayout({ params, children }) {
  const user = await requireUser();  // 401 if unauthenticated
  const tenant = await resolveTenantContext(params.workspaceId);
  
  if (!tenant) {
    throw new ForbiddenError('Access denied');  // Caught by error.tsx → 403
  }
  
  return <Sidebar /> <main>{children}</main>;
}

// app/workspace/[workspaceId]/page.tsx
export default async function WorkspacePage({ params }) {
  const tenant = await resolveTenantContext(params.workspaceId);
  if (!tenant) throw new ForbiddenError('...');
  
  const service = new WorkspaceService(tenant);
  const workspace = await service.getWorkspace();  // throws NotFoundError if null
  const members = await service.getMembers();      // throws ForbiddenError if !canRead
  
  // Data guaranteed valid here
  return <WorkspaceHeader workspace={workspace} />;
}
```

### Service Authorization Pattern

```typescript
export class WorkspaceService {
  async getMembers() {
    // 1. Check policy first (authorization)
    if (!WorkspacePolicy.canRead(this.tenant)) {
      throw new ForbiddenError('Cannot read workspace members');
    }
    
    // 2. Only then access data
    return this.repo.getMembers();
  }
}
```

### Component Props Pattern

All components are **fully presentational**:
- Accept only typed props
- NO data fetching inside
- NO `fetch()` calls
- NO Prisma calls
- NO `useEffect` data loading

```typescript
// ❌ Bad: component fetches data
function UserList() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    fetch('/api/users').then(setUsers);
  }, []);
  return <div>{users.map(...)}</div>;
}

// ✅ Good: props only
function UserList({ users }: { users: User[] }) {
  return <div>{users.map(...)}</div>;
}

// Data fetched in server component
const users = await service.getUsers();
return <UserList users={users} />;
```

### Error Boundary Pattern

```typescript
// error.tsx - " use client" required
export default function Error({ error, reset }) {
  const title = error.name === 'ForbiddenError' ? '403' : 'Error';
  return <ErrorMessage title={title} message={error.message} onReset={reset} />;
}
```

### Loading Pattern

```typescript
// loading.tsx
export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-32" />
    </div>
  );
}
```

**Why not Suspense boundaries in Page?**
- `loading.tsx` is simpler and more declarative
- Works with Next.js route segments naturally
- Cleaner for complex layouts

### Query Optimization

All repository queries include necessary relations:

```typescript
// ❌ N+1 queries
const members = await db.workspaceMember.findMany({ where: { workspaceId } });
const usersWithDetails = members.map(m => fetch(`/api/users/${m.userId}`)); // Multiple requests!

// ✅ Optimized with include/select
const members = await db.workspaceMember.findMany({
  where: { workspaceId },
  include: {
    user: { select: { id: true, email: true, name: true } }  // 1 query, all data
  }
});
```

### Tenant Context Propagation

```typescript
// Only resolved once per request, passed down
const tenant = await resolveTenantContext(workspaceId);

// Service layer
new WorkspaceService(tenant).getWorkspace();  // tenant.workspaceId scopes query
new ProjectService(tenant).listProjects();    // same tenant scope

// Repository layer
new ProjectRepository(tenant).listProjects(); // uses tenant.workspaceId in where clause
```

---

## Key Design Decisions

See [decisions.md](./decisions.md) for detailed rationale.

### 1. Prisma over Raw SQL
- Type safety out of the box
- Migration management
- Beginner-friendly API

### 2. Server Actions over API Routes
- No separate API layer needed
- Type-safe end-to-end
- Built-in form handling

### 3. Singleton Prisma Client
- Prevents connection pool exhaustion in dev
- Hot reload safe
- Production optimized

### 4. `workspaceId` in Tenant Models
- Database-level isolation
- Impossible to forget tenant check
- Query performance optimized with indexes

---

## Security Considerations

### 1. Tenant Isolation
- `workspaceId` is REQUIRED in all tenant queries
- Indexes ensure performant filtering
- Cascade deletes clean up tenant data

### 2. Role Validation
- Check `WorkspaceMember.role` before operations
- Workspace-scoped permissions only
- No global admin bypass

### 3. Input Validation
- Zod schemas for all user input
- Structured error messages
- Type-safe throughout

---

## Development Workflow

1. **Schema changes** → Update `prisma/schema.prisma`
2. **Migration** → `npx prisma migrate dev`
3. **Generate client** → `npx prisma generate` (automatic)
4. **Validation** → Create Zod schema
5. **Server action** → Use `parseFormData` helper
6. **UI integration** → Call action from client component

---

## Future Enhancements

- Repository pattern for all models
- Permission middleware
- Real-time updates (WebSockets)
- File attachments
- Advanced search
- Team activity feeds
