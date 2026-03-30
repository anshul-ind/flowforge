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
