# Phase-4: Authorization & Permission System

## Overview

Phase-4 implements role-based access control (RBAC) and enforces authorization checks across the service layer.

**Key Components:**
1. **Role-Matrix** (`lib/permissions/role-matrix.ts`) - Single source of truth for permissions
2. **Policies** (module-level) - Helper functions that check permissions
3. **Repositories** - Data access layer (workspace-scoped)
4. **Services** - Business logic with permission enforcement
5. **Integration Helper** (`lib/tenant/service.ts`) - Clean pattern for using requireUser + TenantContext

---

## Architecture

### Permission Model

**Workspace Roles:**
- `OWNER` - Full control (all actions)
- `MANAGER` - Manage projects, invite/remove members (except role changes)
- `MEMBER` - Create/update tasks, request approvals
- `VIEWER` - Read-only access

**Resource Types:**
- `WORKSPACE` - Workspace settings and membership
- `PROJECT` - Projects within workspace
- `TASK` - Tasks within project
- `COMMENT` - Comments on tasks (Phase-5)
- `APPROVAL` - Task approval workflow

### Layer Diagram

```
Server Action / API Route
          ↓
    requireUser() ← Ensures user is authenticated
          ↓
resolveTenantService() ← Gets user + workspace role
          ↓
    Service Layer ← Checks policies before operations
          ↓
    Policies ← Consults role-matrix
          ↓
    Repository ← Queries DB (workspace-scoped)
          ↓
      Database
```

### Request Flow Example

**Creating a project in a workspace:**

```typescript
// Server Action
export async function createProjectAction(
  workspaceId: string,
  { name, description }: ProjectInput
) {
  'use server';

  try {
    // 1. Get authenticated user with workspace context
    const tenant = await resolveTenantService(workspaceId);
    // Returns: { userId, workspaceId, role }
    // Throws: ForbiddenError if not a member

    // 2. Create service with tenant context
    const service = new ProjectService(tenant);

    // 3. Call service method
    // Service will:
    //   - Check policy: canCreate(tenant)
    //   - Throw ForbiddenError if role can't create
    //   - Query repository (scoped to workspace)
    //   - Return created project
    const project = await service.createProject({ name, description });

    return successResult(project);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return errorResult(error.message); // 403
    }
    return errorResult('Failed to create project'); // 500
  }
}
```

---

## Permission Matrix

### Workspace Actions

| Action | OWNER | MANAGER | MEMBER | VIEWER |
|--------|-------|---------|--------|--------|
| Read Workspace | ✓ | ✓ | ✓ | ✓ |
| Update Settings | ✓ | ✓ | ✗ | ✗ |
| Delete Workspace | ✓ | ✗ | ✗ | ✗ |
| Invite Member | ✓ | ✓ | ✗ | ✗ |
| Remove Member | ✓ | ✓ | ✗ | ✗ |
| Manage Roles | ✓ | ✗ | ✗ | ✗ |

### Project Actions

| Action | OWNER | MANAGER | MEMBER | VIEWER |
|--------|-------|---------|--------|--------|
| Read Projects | ✓ | ✓ | ✓ | ✓ |
| Create Project | ✓ | ✓ | ✓ | ✗ |
| Update Project | ✓ | ✓ | ✗ | ✗ |
| Delete Project | ✓ | ✗ | ✗ | ✗ |
| Archive Project | ✓ | ✓ | ✗ | ✗ |

### Task Actions

| Action | OWNER | MANAGER | MEMBER | VIEWER |
|--------|-------|---------|--------|--------|
| Read Tasks | ✓ | ✓ | ✓ | ✓ |
| Create Task | ✓ | ✓ | ✓ | ✗ |
| Update Task | ✓ | ✓ | ✓ | ✗ |
| Delete Task | ✓ | ✓ | ✗ | ✗ |
| Assign Task | ✓ | ✓ | ✓ | ✗ |
| Bulk Update | ✓ | ✓ | ✗ | ✗ |

### Approval Actions

| Action | OWNER | MANAGER | MEMBER | VIEWER |
|--------|-------|---------|--------|--------|
| Read Approvals | ✓ | ✓ | ✓ | ✓ |
| Create Request | ✓ | ✓ | ✓ | ✗ |
| Approve | ✓ | ✓ | ✓ | ✗ |
| Reject | ✓ | ✓ | ✗ | ✗ |

---

## File Structure

```
lib/
  permissions/
    role-matrix.ts         ← Permission matrix
  tenant/
    tenant-context.ts      ← Type definition
    resolve-tenant.ts      ← Resolve membership + role
    service.ts             ← Integration helper
  errors/
    authorization.ts       ← ForbiddenError, NotFoundError

modules/
  workspace/
    policies.ts            ← WorkspacePolicy namespace
    repository.ts          ← WorkspaceRepository class
    service.ts             ← WorkspaceService class
  project/
    policies.ts            ← ProjectPolicy namespace
    repository.ts          ← ProjectRepository class
    service.ts             ← ProjectService class
  task/
    policies.ts            ← TaskPolicy namespace
    repository.ts          ← TaskRepository class
    service.ts             ← TaskService class
  approval/
    policies.ts            ← ApprovalPolicy namespace
    repository.ts          ← ApprovalRepository class
    service.ts             ← ApprovalService class
```

---

## Usage Patterns

### Pattern 1: Server Actions (Most Common)

```typescript
// app/(dashboard)/[workspaceId]/projects/actions.ts

'use server';

import { resolveTenantService } from '@/lib/tenant/service';
import { ProjectService } from '@/modules/project/service';
import { ForbiddenError } from '@/lib/errors/authorization';

export async function createProjectAction(
  workspaceId: string,
  formData: FormData
) {
  try {
    const tenant = await resolveTenantService(workspaceId);
    const service = new ProjectService(tenant);

    const project = await service.createProject({
      name: formData.get('name') as string,
      description: formData.get('description') as string,
    });

    return { success: true, data: project };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { success: false, message: error.message };
    }
    throw error;
  }
}
```

### Pattern 2: API Routes

```typescript
// app/api/workspaces/[workspaceId]/projects/route.ts

import { resolveTenantService } from '@/lib/tenant/service';
import { ProjectService } from '@/modules/project/service';
import { ForbiddenError, NotFoundError } from '@/lib/errors/authorization';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const tenant = await resolveTenantService(params.workspaceId);
    const service = new ProjectService(tenant);

    const projects = await service.listProjects();
    return NextResponse.json(projects);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    throw error;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const tenant = await resolveTenantService(params.workspaceId);
    const service = new ProjectService(tenant);

    const data = await req.json();
    const project = await service.createProject(data);

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    throw error;
  }
}
```

### Pattern 3: Direct Service Usage (Admin Scripts)

```typescript
// scripts/admin/create-project.ts

import { db } from '@/lib/db';
import { ProjectService } from '@/modules/project/service';

const workspace = await db.workspace.findUnique({
  where: { slug: 'acme' },
});

const user = await db.workspaceMember.findFirst({
  where: {
    workspaceId: workspace!.id,
    user: { email: 'admin@acme.com' },
  },
});

const tenant = {
  userId: user!.userId,
  workspaceId: workspace!.id,
  role: user!.role,
};

const service = new ProjectService(tenant);
const project = await service.createProject({
  name: 'Q4 Planning',
  description: 'Q4 2024 project planning',
});

console.log('Created:', project);
```

---

## Tenant Safety Principles

### 1. Always Include `workspaceId` in Queries

```typescript
// ✅ SAFE
const tasks = await db.task.findMany({
  where: {
    workspaceId: tenant.workspaceId,
  },
});

// ❌ DANGEROUS
const tasks = await db.task.findMany({
  // Missing workspaceId - leaks data across workspaces!
});
```

### 2. Use Repository Pattern

```typescript
// ✅ RECOMMENDED
const repo = new ProjectRepository(tenant);
const project = await repo.getProject(projectId);
// Repo automatically scopes to workspace

// ⚠️ RISKY
const project = await db.project.findUnique({
  where: { id: projectId },
  // Manual scoping needed - easy to forget
});
```

### 3. Always Check Permissions Before Access

```typescript
// ✅ SAFE
async createTask(taskData) {
  if (!TaskPolicy.canCreate(this.tenant)) {
    throw new ForbiddenError('Cannot create tasks');
  }
  return await this.repo.createTask(taskData);
}

// ❌ DANGEROUS
async createTask(taskData) {
  // No permission check - service returns forbidden 403
  // instead of preventing access at service layer
  return await this.repo.createTask(taskData);
}
```

### 4. Verify Cross-Tenant References

```typescript
// ✅ SAFE - Verify project belongs to workspace
async createTask(projectId: string, taskData: any) {
  const project = await db.project.findFirst({
    where: {
      id: projectId,
      workspaceId: this.tenant.workspaceId,
    },
  });
  if (!project) return null; // Not found in this workspace
  // Safe to create task
}

// ❌ DANGEROUS
async createTask(projectId: string, taskData: any) {
  // No workspace check - could create task in wrong workspace
  const project = await db.project.findUnique({
    where: { id: projectId },
  });
}
```

### 5. Error Handling Privacy

```typescript
// ✅ SAFE - Never reveal if resource exists in other workspaces
if (!user) throw new NotFoundError('Project not found');
if (user.workspaceId !== tenant.workspaceId) {
  throw new NotFoundError('Project not found');
  // Don't say "different workspace", just "not found"
}

// ❌ DANGEROUS
if (user.workspaceId !== tenant.workspaceId) {
  throw new ForbiddenError('This project belongs to another workspace');
  // Leaks information about other workspaces
}
```

---

## Common Errors & Solutions

### Error: "Cannot create projects"

**Cause:** User role doesn't have permission

**Solution:** Check role in workspace members, or ask OWNER to upgrade role

### Error: "Project not found"

**Cause:** Either:
- Project doesn't exist
- Project is in different workspace
- User doesn't have permission

**Solution:** Verify you're in correct workspace and project exists

### Error: "Cannot approve - not assigned approver"

**Cause:** Different user is assigned to approve

**Solution:** Request the assigned approver to approve, or ask OWNER/MANAGER to handle

---

## Testing Authorization

### Test Permission Denied

```typescript
// Test that VIEWER can't create projects
const testTenant = { role: 'VIEWER' };
expect(() => ProjectPolicy.canCreate(testTenant)).toBeFalsy();
```

### Test Permission Allowed

```typescript
// Test that MANAGER can create projects
const testTenant = { role: 'MANAGER' };
expect(() => ProjectPolicy.canCreate(testTenant)).toBeTruthy();
```

### Test Workspace Scoping

```typescript
// Test that query is scoped to workspace
const repo = new ProjectRepository(tenant);
const project = await repo.getProject('project-from-other-workspace');
expect(project).toBeNull(); // Not found in this workspace
```

---

## Audit & Logging (Phase-5)

Future phases will add:
- Audit log entries for permission-denied actions
- Admin dashboard showing access patterns
- Alerts for suspicious permission usage

---

## Next Steps

**Phase-5 will add:**
- Comment ownership checks
- Analytics dashboards
- Search across workspace
- Rate limiting
- Optimistic UI

**No changes to authorization will be needed** - infrastructure is now in place.
