# Tenant Safety Guide

## Critical: Never Skip Workspace Scoping

### The Golden Rule

**Every query that accesses user data MUST include `workspaceId` in the where clause.**

This is the ONLY thing preventing your app from becoming a data leak vulnerability.

---

## Database Patterns

### Pattern 1: Direct ID Query (DANGEROUS)

```prisma
// ❌ NEVER DO THIS
const task = await db.task.findUnique({
  where: { id: taskId }
  // Missing workspaceId - could fetch ANY task!
});
```

**Risk:** User can craft request with taskId from other workspace and read/modify it.

### Pattern 2: Scoped Query (CORRECT)

```typescript
// ✅ ALWAYS DO THIS
const task = await db.task.findFirst({
  where: {
    id: taskId,
    workspaceId: tenant.workspaceId  // ← REQUIRED
  }
});
```

**Safe:** Even if attacker uses wrong taskId, query returns null because workspace doesn't match.

### Pattern 3: List Queries

```typescript
// ❌ DANGEROUS
const tasks = await db.task.findMany({
  where: { projectId }
  // Could be project from other workspace!
});

// ✅ CORRECT
const tasks = await db.task.findMany({
  where: {
    projectId,
    workspaceId: tenant.workspaceId  // ← REQUIRED
  }
});
```

### Pattern 4: Nested Relations

```typescript
// ❌ RISKY - Doesn't verify project is in workspace
const project = await db.project.findUnique({
  where: { id: projectId },
  include: { tasks: true }  // Could include tasks from other workspaces!
});

// ✅ CORRECT
const project = await db.project.findFirst({
  where: {
    id: projectId,
    workspaceId: tenant.workspaceId  // ← REQUIRED
  },
  include: { tasks: true }
});
```

---

## Service Layer Patterns

### Pattern: Verify Resource Belongs to Workspace

```typescript
class ProjectService {
  constructor(private tenant: TenantContext) {}

  async updateProject(projectId: string, data: any) {
    // Step 1: Check permission
    if (!ProjectPolicy.canUpdate(this.tenant)) {
      throw new ForbiddenError('Cannot update projects');
    }

    // Step 2: Verify project is in THIS workspace
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        workspaceId: this.tenant.workspaceId  // ← CRITICAL
      }
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Step 3: Safe to update
    return await db.project.update({
      where: { id: projectId },
      data
    });
  }
}
```

### Pattern: Verify Cross-Tenant References

When task is assigned to a user, verify user is in workspace:

```typescript
class TaskService {
  async assignTask(taskId: string, userId: string) {
    // Get task (already scoped to workspace)
    const task = await this.repo.getTask(taskId);
    if (!task) throw new NotFoundError('Task not found');

    // ✅ CRITICAL: Verify assignee is a member
    const isMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: this.tenant.workspaceId
        }
      }
    });

    if (!isMember) {
      throw new Error('User is not a workspace member');
      // ← Prevents assigning task to user from other workspace
    }

    return await this.repo.assignTask(taskId, userId);
  }
}
```

---

## Multi-Step Operation Safety

### Scenario: Create task with comment

**Risky approach:**

```typescript
// ❌ DANGEROUS
export async function createTaskWithComment(data: any) {
  const task = await db.task.create({
    data: {
      ...data,
      workspaceId: tenant.workspaceId  // ✓ Correct
    }
  });

  // PROBLEM: What if this fails?
  const comment = await db.comment.create({
    data: {
      taskId: task.id,
      content: data.comment,
      workspaceId: tenant.workspaceId  // ✓ Correct
      // BUT: taskId could be manipulated!
    }
  });
}
```

**Safer approach:**

```typescript
// ✅ BETTER
export async function createTaskWithComment(data: any) {
  // Use transaction to ensure both complete or both rollback
  const [task, comment] = await db.$transaction([
    db.task.create({
      data: {
        ...data,
        workspaceId: tenant.workspaceId
      }
    }),
    db.comment.create({
      data: {
        taskId: data.taskId,  // Use input, not result
        content: data.comment,
        workspaceId: tenant.workspaceId
      }
    })
  ]);

  // Verify result
  if (!task || !comment) throw new Error('Failed to create');
  return { task, comment };
}
```

---

## URL Parameter Safety

### Scenario: User visits `/workspace/[workspaceId]/projects`

**Dangerous pattern:**

```typescript
// ❌ UNSAFE
export default async function ProjectsPage({
  params: { workspaceId }
}: {
  params: { workspaceId: string }
}) {
  // User can visit /workspace/ATTACKER_WORKSPACE_ID/projects
  const projects = await db.project.findMany({
    where: { workspaceId }
    // No check that user is member of this workspace!
  });
}
```

**Safe pattern:**

```typescript
// ✅ SAFE
import { resolveTenantService } from '@/lib/tenant/service';

export default async function ProjectsPage({
  params: { workspaceId }
}: {
  params: { workspaceId: string }
}) {
  // This throws ForbiddenError if user is not a member
  const tenant = await resolveTenantService(workspaceId);
  // ← Resolves user's role, verifies membership

  const service = new ProjectService(tenant);
  const projects = await service.listProjects();
  // Queries are automatically scoped to tenant.workspaceId
}
```

---

## API Route Safety

### Scenario: Fetch projects via API

**Dangerous endpoint:**

```typescript
// ❌ UNSAFE API
export async function GET(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  // No authentication check!
  // No workspace membership check!
  const projects = await db.project.findMany({
    where: { workspaceId: params.workspaceId }
  });

  return NextResponse.json(projects);
}
```

**Safe endpoint:**

```typescript
// ✅ SAFE API
import { resolveTenantService } from '@/lib/tenant/service';
import { ProjectService } from '@/modules/project/service';

export async function GET(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    // Ensures user is authenticated AND member
    const tenant = await resolveTenantService(params.workspaceId);

    const service = new ProjectService(tenant);
    const projects = await service.listProjects();

    return NextResponse.json(projects);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    throw error;
  }
}
```

---

## Common Mistakes

### Mistake 1: Trust User Input

```typescript
// ❌ WRONG
const workspaceId = req.query.workspaceId;
const projects = await db.project.findMany({
  where: { workspaceId }
  // Just because client sent it doesn't mean they own it!
});

// ✅ RIGHT
const tenant = await resolveTenantService(req.query.workspaceId);
// Now tenant.workspaceId is verified to belong to user
```

### Mistake 2: Use IDs as Secrets

```typescript
// ❌ WRONG
const task = await db.task.findUnique({
  where: { id: taskId }
  // Task ID is NOT secret - attacker can guess/brute-force
});

// ✅ RIGHT
const task = await db.task.findFirst({
  where: {
    id: taskId,
    workspaceId: tenant.workspaceId
  }
  // Even if attacker guesses taskId, they need workspace access
});
```

### Mistake 3: Forget Permission on Update

```typescript
// ❌ WRONG
async updateProject(projectId: string, data: any) {
  // Forgot to check permission!
  return await this.repo.updateProject(projectId, data);
}

// ✅ RIGHT
async updateProject(projectId: string, data: any) {
  if (!ProjectPolicy.canUpdate(this.tenant)) {
    throw new ForbiddenError('Cannot update projects');
  }
  return await this.repo.updateProject(projectId, data);
}
```

### Mistake 4: Return Error That Leaks Info

```typescript
// ❌ WRONG
if (project.workspaceId !== tenant.workspaceId) {
  throw new ForbiddenError('Cannot access project from different workspace');
  // Attacker learns workspace structure!
}

// ✅ RIGHT
if (project.workspaceId !== tenant.workspaceId) {
  throw new NotFoundError('Project not found');
  // Same error as if project doesn't exist
}
```

---

## Checklist: Before Going to Production

- [ ] Every DB query includes `workspaceId` in where clause
- [ ] Every service method checks permissions before access
- [ ] Cross-workspace references validated (e.g., user in workspace before assigning)
- [ ] Error messages don't leak workspace structure
- [ ] API routes resolve tenant before querying
- [ ] Server actions use `resolveTenantService()`
- [ ] No direct access to `.prisma` client outside repositories
- [ ] All multi-step operations use transactions
- [ ] Tests verify workspace isolation (same ID in different workspaces fails)
- [ ] Audit review confirms no data leaks

---

## Testing Tenant Safety

### Test 1: Workspace Isolation

```typescript
describe('Tenant Isolation', () => {
  it('should not return project from different workspace', async () => {
    const repo = new ProjectRepository(tenantA);
    const projectFromB = await repo.getProject(projectBId);
    // Should be null since project is in workspace B, not A
    expect(projectFromB).toBeNull();
  });
});
```

### Test 2: Permission Enforcement

```typescript
describe('Authorization', () => {
  it('should throw ForbiddenError when viewer tries to create', async () => {
    const service = new ProjectService(viewerTenant);
    await expect(
      service.createProject({ name: 'Test' })
    ).rejects.toThrow(ForbiddenError);
  });
});
```

### Test 3: Cross-Tenant Reference

```typescript
describe('Cross-Tenant Safety', () => {
  it('should not assign task to user from different workspace', async () => {
    const service = new TaskService(tenantA);
    const result = await service.assignTask(taskId, userFromB.id);
    // Should return null or throw error
    expect(result).toBeNull();
  });
});
```

---

## Questions to Ask During Review

1. **Does every query include `workspaceId`?**
2. **Are cross-workspace references validated?**
3. **Do error messages leak information?**
4. **Are permissions checked before data access?**
5. **Are URL parameters verified before use?**
6. **Would a VIEWER see what a MANAGER sees?**
7. **Could a MEMBER delete another's comments?**
8. **Can users invite people from other workspaces?**

If you answer NO to any question, there's a security issue.
