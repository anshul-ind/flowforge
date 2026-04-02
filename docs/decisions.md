# Technical Decisions

This document records key architectural decisions and their rationale.

---

## Database & ORM

### Decision: Prisma as ORM

**Chosen:** Prisma  
**Alternatives considered:** TypeORM, Drizzle, Raw SQL

**Rationale:**
- **Type safety:** Full TypeScript support with generated types
- **Beginner-friendly:** Intuitive API compared to raw SQL
- **Migration management:** Built-in migration system
- **Relationship handling:** Automatic JOIN resolution
- **Ecosystem:** Excellent Next.js integration

**Trade-offs:**
- Slightly less flexible than raw SQL for complex queries
- Generated client adds to bundle size (mitigated by server-only usage)

---

## Multi-Tenancy Strategy

### Decision: `workspaceId` in All Tenant-Owned Tables

**Chosen:** Direct `workspaceId` foreign key in tenant models  
**Alternatives considered:** Row-level security, separate schemas per tenant

**Rationale:**
- **Safety:** Database-level enforcement prevents data leaks
- **Performance:** Indexed `workspaceId` enables fast queries
- **Simplicity:** No complex middleware or schema switching
- **Clarity:** Explicit tenant boundary in every query

**Implementation:**
```sql
-- Every tenant-owned table
CREATE TABLE "Task" (
  "id" TEXT PRIMARY KEY,
  "workspaceId" TEXT NOT NULL REFERENCES "Workspace"("id"),
  -- other fields
);

-- Indexed for performance
CREATE INDEX "Task_workspaceId_idx" ON "Task"("workspaceId");
```

**Models with `workspaceId`:**
1. WorkspaceMember
2. Project
3. Task
4. Comment
5. ApprovalRequest
6. Notification
7. AuditLog

**Models WITHOUT `workspaceId`:**
- User (global, multi-workspace)
- Workspace (root tenant entity)
- TaskDependency (inherits from Task)

---

## Access Control

### Decision: Workspace-Scoped Roles (No Global Roles)

**Chosen:** Role stored in `WorkspaceMember` junction table  
**Alternatives considered:** Global role in User table, separate Permissions table

**Rationale:**
- **Flexibility:** User can be OWNER in one workspace, VIEWER in another
- **Isolation:** No cross-workspace privilege escalation
- **Simplicity:** Single source of truth for permissions
- **Scalability:** Easy to add workspace-specific settings

**Schema:**
```prisma
model User {
  id    String @id
  email String @unique
  // NO role field here!
}

model WorkspaceMember {
  id          String        @id
  role        WorkspaceRole // Role is per-workspace!
  userId      String
  workspaceId String
}
```

**Enum:**
```prisma
enum WorkspaceRole {
  OWNER    // Full control
  MANAGER  // Can manage projects/tasks
  MEMBER   // Can work on tasks
  VIEWER   // Read-only access
}
```

---

## Data Access Pattern

### Decision: Repository Pattern (Future)

**Chosen:** Workspace-scoped repositories  
**Current:** Direct Prisma client with manual scoping

**Rationale:**
- **Consistency:** Every query automatically scoped to workspace
- **Safety:** Impossible to forget tenant check
- **Testability:** Easy to mock repositories
- **Maintainability:** Centralized query logic

**Future pattern:**
```typescript
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
        workspaceId: this.workspaceId // Always enforced!
      }
    });
  }
}
```

**Current approach (Phase 2):**
```typescript
// Direct usage in server actions
export async function getProject(workspaceId: string, projectId: string) {
  return db.project.findUnique({
    where: { id: projectId, workspaceId }
  });
}
```

---

## Validation & Error Handling

### Decision: ActionResult<T> + Zod Parse Helpers

**Chosen:** Structured result type with Zod integration  
**Alternatives considered:** Throwing exceptions, plain boolean returns

**Rationale:**
- **Type safety:** Generic `ActionResult<T>` ensures consistent responses
- **User experience:** Field-level errors for better UX
- **Consistency:** Same pattern across all server actions
- **Beginner-friendly:** Clear success/error states

**Type definition:**
```typescript
export type ActionResult<T = void> =
  | { success: true; message?: string; data?: T }
  | { success: false; message?: string; formError?: string; fieldErrors?: Record<string, string[]> };
```

**Usage pattern:**
```typescript
'use server';

export async function createProject(formData: FormData): Promise<ActionResult<Project>> {
  // 1. Validate
  const result = parseFormData(createProjectSchema, formData);
  if (!result.success) return result; // Return field errors

  // 2. Business logic
  const project = await db.project.create({ data: result.data });

  // 3. Success response
  return successResult(project, 'Project created!');
}
```

---

## Database Client

### Decision: Singleton Prisma Client Pattern

**Chosen:** Global singleton with HMR safety  
**Alternatives considered:** New instance per request, connection pooling

**Rationale:**
- **Development:** Prevents connection pool exhaustion during HMR
- **Performance:** Reuses connection pool across requests
- **Production:** Each serverless function gets isolated instance
- **Simplicity:** Team rule: always `import { db } from '@/lib/db'`

**Implementation:**
```typescript
// lib/db/client.ts
const globalForPrisma = globalThis as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
```

**Why this matters:**
```
❌ Without singleton:
  - HMR triggers → New PrismaClient() → New connection pool
  - 50+ saves = 50+ connection pools = Database exhausted!

✅ With singleton:
  - HMR triggers → Reuse globalThis.prisma → Same connection pool
  - Unlimited saves = 1 connection pool = Happy database!
```

---

## Core Entities Design

### Decision: 10 Models for MVP

**Chosen models:**
1. **User** - Global authentication
2. **Workspace** - Tenant root
3. **WorkspaceMember** - Membership + role
4. **Project** - Workspace projects
5. **Task** - Project tasks
6. **TaskDependency** - Task relationships
7. **Comment** - Task discussions
8. **ApprovalRequest** - Task approval workflow
9. **Notification** - User alerts
10. **AuditLog** - Activity tracking

**Rationale:**
- **Minimal but complete:** Covers core PM workflows
- **Extensible:** Easy to add features later
- **Standard patterns:** Tasks, projects, comments are familiar
- **Audit trail:** `AuditLog` for compliance and debugging

**Excluded from MVP:**
- File attachments (can add later)
- Time tracking (nice-to-have)
- Custom fields (complex, defer)
- Advanced permissions (start simple)

---

## Enum Design

### Decision: 7 Enums for Domain Constraints

**Chosen:**
- `WorkspaceRole` - Access levels
- `ProjectStatus` - Project lifecycle
- `TaskStatus` - Task workflow
- `TaskPriority` - Urgency levels
- `ApprovalStatus` - Approval states
- `NotificationType` - Notification categories
- `AuditAction` - Trackable actions

**Rationale:**
- **Type safety:** Compile-time checks for valid states
- **Database constraints:** Enum type enforces valid values
- **Beginner-friendly:** Clear, readable status values
- **Consistency:** Same terminology across app

**Naming consistency:**
```
✅ Consistent verb tense within each enum
✅ Action-based naming (TASK_ASSIGNED, not ASSIGN_TASK)
✅ Hierarchical naming (workspace → project → task)
```

---

## Technology Choices

### Decision: Next.js 15 with App Router

**Rationale:**
- Server actions for type-safe mutations
- React Server Components for performance
- File-based routing for simplicity
- Active ecosystem and support

### Decision: PostgreSQL over MySQL/MongoDB

**Rationale:**
- Advanced features (enums, full-text search)
- Strong data integrity
- Excellent Prisma support
- Heroku/Vercel/Railway compatibility

### Decision: TypeScript Strict Mode

**Rationale:**
- Catch errors at compile time
- Better IDE autocomplete
- Self-documenting code
- Industry standard for production apps

---

## Authentication & Session Management

### Decision: Auth.js (NextAuth.js) for Authentication

**Chosen:** Auth.js v4 with Credentials provider  
**Alternatives considered:** Better Auth, custom JWT implementation, Clerk, Auth0

**Rationale:**
- **Next.js integration:** Official Next.js authentication library
- **Flexibility:** Supports multiple providers (Credentials, OAuth, etc.)
- **Session management:** Built-in JWT and database session strategies
- **Middleware support:** Seamless middleware integration for route protection
- **Active ecosystem:** Large community, extensive documentation

**Trade-offs:**
- More configuration than managed services (Clerk, Auth0)
- Need to implement own password hashing and validation
- Session type extensions require custom TypeScript declarations

**Implementation:**
```typescript
// auth.ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Credentials({ /* ... */ })],
  session: { strategy: 'jwt' },
  callbacks: { /* session/jwt extensions */ }
});
```

**Environment:**
- `AUTH_SECRET` - Required for JWT signing (generate with `openssl rand -base64 32`)

---

## Phase-6: Server Components & Layouts

### Decision: Resolve TenantContext in Layouts (Not Pages)

**Chosen:** Tenant resolution in layout, pages assume valid tenant  
**Alternatives considered:** Resolve in each page, use middleware

**Rationale:**
- **DRY:** Avoid repeating tenant resolution in every page
- **Early error:** Throw `ForbiddenError` once, caught by `error.tsx`
- **Natural scope:** Layouts wrap pages perfectly for this pattern
- **Performance:** Single resolution per route segment
- **Clarity:** Layout structure matches tenant isolation structure

**Implementation:**
```typescript
// app/workspace/[workspaceId]/layout.tsx
export default async function WorkspaceLayout({ params, children }) {
  const user = await requireUser();
  const tenant = await resolveTenantContext(params.workspaceId);
  
  if (!tenant) {
    throw new ForbiddenError('You do not have access to this workspace');
  }
  
  // All children can assume tenant is valid
  return <Sidebar /><main>{children}</main>;
}

// app/workspace/[workspaceId]/page.tsx
// tenant already validated by parent layout,
// but we still resolve again for safety
export default async function WorkspacePage({ params }) {
  const tenant = await resolveTenantContext(params.workspaceId);
  if (!tenant) throw new ForbiddenError('...');
  
  // Fetch with tenant
  const workspace = await workspaceService.getWorkspace();
}
```

**Rationale for double-check in page:**
- Defensive programming pattern
- Explicit intent in each component
- Catches programming errors early

### Decision: Presentational Components (No Data Fetching)

**Chosen:** Components accept only props, never fetch data  
**Alternatives considered:** Fetch in components, use hooks

**Rationale:**
- **Testability:** Easy to test with mock props
- **Reusability:** Same component works with different data
- **Performance:** No waterfalls or race conditions
- **Clarity:** Data dependency graph is visible in parents
- **Debugging:** Easy to trace data flow

**Pattern:**
```typescript
// ❌ Bad: component fetches data
export function ProjectList() {
  const [projects, setProjects] = useState([]);
  useEffect(() => {
    fetch('/api/projects').then(setProjects);
  }, []);
  return <div>{projects.map(p => <Card key={p.id} project={p} />)}</div>;
}

// ✅ Good: props only
export function ProjectList({ projects }: { projects: Project[] }) {
  return <div>{projects.map(p => <Card key={p.id} project={p} />)}</div>;
}

// Data fetched in server component
const projects = await projectService.listProjects();
return <ProjectList projects={projects} />;
```

**Benefits:**
- No loading states inside component (use `loading.tsx`)
- No error handling in component (use `error.tsx`)
- Components are pure functions of props
- One query per page, clear data dependency

### Decision: `loading.tsx` Over Suspense Boundaries

**Chosen:** Route segment `loading.tsx` files  
**Alternatives considered:** Suspense + async components, useTransition hooks

**Rationale:**
- **Simplicity:** One file per route, clear structure
- **Built-in:** Next.js native support, no custom logic
- **Clarity:** Skeletons co-located with routes
- **Consistency:** Same pattern everywhere in codebase

**Implementation:**
```typescript
// app/workspace/[workspaceId]/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-32" />
      // ... match page layout structure
    </div>
  );
}
```

**Not using Suspense because:**
- Pages can be simpler (no granular boundaries needed)
- `loading.tsx` is declarative - file name == loading state
- Skeleton structure naturally matches page structure
- Easier for beginners than composition boundaries

### Decision: `error.tsx` as Error Boundary

**Chosen:** Route segment `error.tsx` with `'use client'` directive  
**Alternatives considered:** Global error handler, custom Suspense fallbacks

**Rationale:**
- **Scoped boundaries:** Each route handles its own errors
- **Native Next.js:** Built-in support, no custom wrapping
- **Clear recovery:** `reset()` callback available per boundary
- **Type safety:** Error received with full type information

**Implementation:**
```typescript
// app/workspace/[workspaceId]/error.tsx
'use client';

export default function Error({ error, reset }) {
  if (error.name === 'ForbiddenError') {
    return <ErrorMessage title="403" message="Access denied" onReset={reset} />;
  }
  return <ErrorMessage title="Error" message={error.message} onReset={reset} />;
}
```

**Must be client component because:**
- Needs `reset()` callback (React feature)
- Needs to render error UI (client rendering)
- Props come from Next.js error boundary, require client component

### Decision: Service Layer Authorization Checks

**Chosen:** Authorization check in service BEFORE data access  
**Alternatives considered:** In repository, in action, in middleware

**Rationale:**
- **Security first:** Check permissions before touching database
- **Performance:** Fail fast on invalid authorization
- **Reusability:** Same check for API routes, actions, pages
- **Clarity:** Clear intent: "can I do this?" before "do it"

**Pattern:**
```typescript
export class ProjectService {
  constructor(private tenant: TenantContext) {}

  async getProject(projectId: string): Promise<Project> {
    // 1. Check authorization FIRST
    if (!ProjectPolicy.canRead(this.tenant)) {
      throw new ForbiddenError('Cannot read projects');
    }

    // 2. Only then access data
    const project = await this.repo.getProject(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    return project;
  }
}
```

**Why not in repository?**
- Repository is data-only, shouldn't know business rules
- Authorization is orthogonal to query execution
- Easier to test authorization separately

### Decision: Query Optimization with Include/Select

**Chosen:** Explicit `include` and `select` in Prisma queries  
**Alternatives considered:** Lazy loading, separate queries, ORM auto-loading

**Rationale:**
- **N+1 prevention:** Related data loaded in single query
- **Bandwidth:** `select` eliminates unnecessary fields
- **Performance:** Faster than multiple round trips
- **Clarity:** Query dependencies visible in code

**Pattern:**
```typescript
// ❌ N+1 queries
const members = await db.workspaceMember.findMany({
  where: { workspaceId }
});
const withUsers = await Promise.all(
  members.map(m => db.user.findUnique({ where: { id: m.userId } }))
); // Multiple queries!

// ✅ Single optimized query
const members = await db.workspaceMember.findMany({
  where: { workspaceId },
  include: {
    user: { select: { id: true, email: true, name: true } }
  }
});
```

**Trade-off:**
- Slightly more verbose than global lazy loading
- But prevents accidental N+1 problems
- Makes performance characteristics explicit

### Decision: Typed Props Over Unions

**Chosen:** Specific interfaces for component props  
**Alternatives considered:** Union types, discriminated unions

**Rationale:**
- **Simplicity:** Easier to understand contract
- **IDE support:** Better autocomplete
- **Maintainability:** Changes to types are obvious
- **Testing:** Easy to create mock props

**Pattern:**
```typescript
// ❌ Hard to use
interface Props {
  headerOrTitle: Header | string;
  actionOrCallback: (() => void) | Action;
}

// ✅ Clear contracts
interface ProjectCardProps {
  project: Project;
  workspaceId: string;
}

interface ProjectHeaderProps {
  title: string;
  status: ProjectStatus;
}
```

---

## Summary of Phase-6 Principles

1. **Tenant-first:** Every query scoped to `workspaceId`
2. **Authorization-first:** Check permissions before data access
3. **Server-first:** Data fetching in server components
4. **Props-only:** Components are presentational
5. **Error-scoped:** Each route segment handles its errors
6. **Loading-native:** Route skeletons via `loading.tsx`
7. **Type-safe:** No `any`, strict TypeScript throughout
8. **Query-optimized:** Single query per request, `include`/`select` always used
- `AUTH_URL` - Application URL for callbacks

---

### Decision: JWT Session Strategy

**Chosen:** JWT sessions (stateless)  
**Alternatives considered:** Database sessions

**Rationale:**
- **Stateless:** No database lookup on every request
- **Scalability:** Works in serverless environments
- **Performance:** Faster than database session lookup
- **Simplicity:** No session table or cleanup logic needed

**Trade-offs:**
- Cannot revoke sessions instantly (wait for expiry)
- Token size limited (don't store too much data)
- Token refresh needed for long sessions

**When to reconsider:**
- If immediate session revocation is critical
- If storing large amounts of session data
- If strict audit trail of all sessions is required

---

### Decision: Runtime Workspace Membership Validation

**Chosen:** Check WorkspaceMember table on every request  
**Alternatives considered:** Cache membership in session, middleware-level cache

**Rationale:**
- **Security:** Membership can change (user removed from workspace)
- **Real-time:** Changes take effect immediately
- **Simplicity:** No cache invalidation logic needed
- **Accuracy:** Always reflects current database state

**Implementation:**
```typescript
// lib/tenant/resolve-tenant.ts
export async function resolveTenantContext(workspaceId: string) {
  const session = await auth(); // Check authentication
  if (!session) return null;
  
  // Check workspace membership (runtime!)
  const membership = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } }
  });
  
  return membership ? { userId, workspaceId, role: membership.role } : null;
}
```

**Why not cache membership:**
```
Scenario: User removed from workspace
- With cache: May still have access until cache expires
- Without cache: Access denied immediately ✓
```

---

### Decision: Middleware-Based Route Protection

**Chosen:** Auth middleware at root level (`middleware.ts`)  
**Alternatives considered:** Per-page auth checks, HOC wrappers

**Rationale:**
- **Early protection:** Runs before any route code executes
- **Performance:** Can redirect without loading React components
- **Security:** Single point of control, harder to forget
- **UX:** No flash of protected content for unauthorized users

**Implementation:**
```typescript
// middleware.ts (or proxy.ts as reference)
export default auth((req) => {
  const isAuthenticated = !!req.auth;
  const isWorkspaceRoute = req.nextUrl.pathname.startsWith('/workspace');
  
  if (isWorkspaceRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }
});

export const config = {
  matcher: ['/workspace/:path*'],
};
```

**Protected routes:**
- `/workspace/*` - All workspace pages (current)
- Future: `/dashboard`, `/api/analytics`, `/api/search`

---

## Team Guidelines

### 1. Never Use PrismaClient Directly
```typescript
// ❌ DON'T
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ✅ DO
import { db } from '@/lib/db';
```

### 2. Always Scope Tenant Queries
```typescript
// ❌ DON'T
db.project.findUnique({ where: { id: projectId } });

// ✅ DO
db.project.findUnique({ 
  where: { id: projectId, workspaceId } 
});
```

### 3. Use ActionResult for Server Actions
```typescript
// ❌ DON'T
export async function createProject(data: any) {
  const project = await db.project.create({ data });
  return project;
}

// ✅ DO
export async function createProject(formData: FormData): Promise<ActionResult<Project>> {
  const result = parseFormData(schema, formData);
  if (!result.success) return result;
  
  const project = await db.project.create({ data: result.data });
  return successResult(project);
}
```

### 4. Validate All User Input
```typescript
// ❌ DON'T
export async function createProject(formData: FormData) {
  const name = formData.get('name') as string;
  // Use directly? No validation!
}

// ✅ DO
const schema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

const result = parseFormData(schema, formData);
if (!result.success) return result;
```

---

## Phase-5: Shared Patterns Architecture

### Decision: Layered Architecture (Page → Action → Service → Repository → DB)

**Chosen:** Clear responsibility separation across 5 layers  
**Alternatives considered:** Single-layer CRUD, fat models, transaction scripts

**Rationale:**
- **Maintainability:** Each layer has one clear responsibility
- **Testability:** Services easily testable with mocked repositories
- **Reusability:** Services used by actions, routes, background jobs
- **Tenant safety:** Repository layer enforces workspace scoping

**Layer responsibilities:**
1. **Page/Component** - Render UI, receive user input
2. **Server Action** - Parse input, resolve tenant, call service
3. **Service** - Authorization check, business logic, coordinate repository calls
4. **Repository** - Database access (always workspace-scoped)
5. **Database** - Data storage via Prisma

---

### Decision: TenantContext Constructor Injection

**Chosen:** Pass `TenantContext` to services/repositories  
**Alternatives considered:** Thread-local storage, context API, middleware storage

**Rationale:**
- **Explicit:** No hidden dependencies, clear what each instance is scoped to
- **Type-safe:** Compiler ensures context is passed
- **Testable:** Easy to mock with different contexts
- **Functional:** Following dependency injection pattern

**Pattern:**
```typescript
export class ProjectService {
  constructor(private tenant: TenantContext) {
    // Service is scoped to this workspace automatically
  }
}

// In action:
const service = new ProjectService(tenant); // Clear ownership
```

---

### Decision: Repository-Level Workspace Scoping

**Chosen:** Every repository method includes `workspaceId` in query `where` clause  
**Alternatives considered:** Service-level enforcement, middleware-level caching

**Rationale:**
- **Safety-first:** Impossible to forget tenant check (done by repository)
- **Database-level:** PostgreSQL enforces constraint at query level
- **Performance:** Indexes on `workspaceId` optimize queries
- **Simplicity:** Standard pattern throughout codebase

**Implementation:**
```typescript
export class ProjectRepository {
  constructor(private tenant: TenantContext) {}
  
  async findById(projectId: string) {
    return await db.project.findFirst({
      where: {
        id: projectId,
        workspaceId: this.tenant.workspaceId, // ALWAYS included
      }
    });
  }
}
```

**Why this beats alternatives:**
```
Alternative 1: Service-level checks
❌ Service developer could forget check
✓ This approach: Built into repository, impossible to forget

Alternative 2: Middleware caching
❌ Stale cache if workspace membership changes
✓ Runtime check always reflects current state
```

---

### Decision: Service-Level Authorization Checks

**Chosen:** Authorization BEFORE data access (service method start)  
**Alternatives considered:** Repository-level checks, middleware-level enforcement

**Rationale:**
- **Order matters:** Check "can I?" before "what is it?"
- **Performance:** Deny early without database query
- **Clarity:** Authorization policy visible at method start
- **Error nuance:** Can throw specific ForbiddenError vs NotFoundError

**Pattern:**
```typescript
async updateProject(projectId: string, input: UpdateProjectInput) {
  // Step 1: Authorization (before ANY db access)
  if (!ProjectPolicy.canUpdate(this.tenant)) {
    throw new ForbiddenError('Cannot update projects');
  }
  
  // Step 2: Data access
  return await this.repo.update(projectId, input);
}
```

**Why early authorization:**
```
Authorization before data lookup:
❌ 404 error
- User learns resource exists (information leak)

Authorization after data lookup:
✓ 403 Forbidden
- User doesn't know if resource exists or if they lack permission
```

---

### Decision: Validation Before Service Layer

**Chosen:** Always use `parseFormData()` in action BEFORE calling service  
**Alternatives considered:** Service-level validation with Zod, repository validation

**Rationale:**
- **Early return:** Invalid input rejected before reaching business logic
- **Performance:** Fail fast on client input
- **Field errors:** Can return granular field-level errors to UI
- **Clear separation:** Schema validation separate from business validation

**Pattern:**
```typescript
// In action:
const input = parseFormData(createProjectSchema, formData);
if (!input.success) return input; // Return field errors immediately

// In service:
async createProject(input: CreateProjectInput) {
  // input is guaranteed valid here
  // Only do business logic (auth, constraints, side effects)
}
```

**Two types of validation:**
```
1. Zod schema validation (format, length, type)
   → parseFormData() in action, fail with fieldErrors
   
2. Business logic validation (name already exists, user quota exceeded)
   → Custom checks in service, fail with ValidationError
```

---

### Decision: Use Specific Error Types for Known Errors

**Chosen:** Three error types: ForbiddenError, NotFoundError, ValidationError  
**Alternatives considered:** Single Error class, error codes, status enums

**Rationale:**
- **Type safety:** Catch specific error, not generic Error
- **Intent clear:** Error type indicates what went wrong
- **Action mapping:** Easy to map to HTTP status (403, 404, 422)
- **Logging:** Can filter errors by type

**Error types:**
```typescript
ForbiddenError     // 403 - Authorization failed
NotFoundError      // 404 - Resource not found
ValidationError    // 422 - Business logic constraint violated
Error              // 500 - Unexpected error
```

**In action:**
```typescript
try {
  return await service.deleteProject(id);
} catch (err) {
  if (err instanceof ForbiddenError) return errorResult(err.message);
  if (err instanceof NotFoundError) return errorResult(err.message);
  if (err instanceof ValidationError) return errorResult(err.message);
  
  throw err; // Re-throw unexpected errors
}
```

---

### Decision: Module-Based Code Organization

**Chosen:** Feature modules with standardized file structure  
**Alternatives considered:** Horizontal layers (all repos together), feature folders

**Rationale:**
- **Colocation:** Related code in same folder
- **Encapsulation:** Module exports clear API
- **Scalability:** Easy to add new modules
- **Navigation:** File structure matches domain model

**Structure:**
```
modules/project/
├── schemas.ts         # Validation (importable by actions/services)
├── policies.ts        # Authorization rules (imported by service)
├── repository.ts      # Data access (imported by service)
├── service.ts         # Business logic (imported by actions)
├── types.ts           # TypeScript interfaces (exported to components)
└── [action-name].ts   # Server action (imported by forms)
```

**Example imports:**
```typescript
// In action
import { projectService } from '@/modules/project/service';
import { parseFormData } from '@/lib/validation/parse';
import { createProjectSchema } from '@/modules/project/schemas';

// In service
import { ProjectRepository } from './repository';
import { ProjectPolicy } from './policies';
```

---

## Migration Strategy

### Current: Prisma Migrate Dev

**Commands:**
```bash
# Create migration
npx prisma migrate dev --name descriptive_name

# Generate client
npx prisma generate

# Reset database (dev only)
npx prisma migrate reset
```

**Future: Production migrations**
```bash
# Run in CI/CD
npx prisma migrate deploy
```

---

## Open Questions

### Future Decisions Needed:
- [ ] Permission middleware implementation approach
- [ ] File upload strategy (S3, local, database)
- [ ] Real-time updates (WebSockets vs polling)
- [ ] Search implementation (PostgreSQL FTS vs Algolia)
- [ ] Email notification system
- [ ] Rate limiting strategy

---

## References

- [Prisma Multi-Tenancy Patterns](https://www.prisma.io/docs/guides/database/multi-tenancy)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Zod Validation](https://zod.dev/)
