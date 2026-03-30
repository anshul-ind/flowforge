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
