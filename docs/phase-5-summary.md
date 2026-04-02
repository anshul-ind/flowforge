# Phase-5 Implementation Summary

**Phase-5 Goal:** Establish shared patterns for validation, services, repositories, and actions.

**Status:** ✅ Complete - All templates and documentation created

---

## What Phase-5 Establishes

### 1. Standard Request Flow
```
Client Input
    ↓
Server Action / Route Handler
    ↓
Input Validation (Zod)
    ↓
Tenant Resolution
    ↓
Service Layer
    ├─ Authorization
    ├─ Business Logic
    └─ Repository Calls
    ↓
Repository Layer (DB-only, workspace-scoped)
    ↓
Database (PostgreSQL + Prisma)
    ↓
Structured Response (ActionResult)
```

### 2. Five-Layer Architecture

| Layer | File | Responsibility | Rules |
|-------|------|-----------------|-------|
| **Validation** | `modules/*/schemas.ts` | Input parsing with Zod | Single source of truth, never duplicate |
| **ACTION/ROUTE** | `modules/*/[action].ts` | Receive input, orchestrate | Call requireUser, parseFormData, resolveTenantContext |
| **SERVICE** | `modules/*/service.ts` | Business logic | Auth first, then repository calls |
| **REPOSITORY** | `modules/*/repository.ts` | Database access | Always workspace-scoped, throw NotFoundError |
| **DATABASE** | `prisma/schema.prisma` | Data storage | PostgreSQL + Prisma |

### 3. Module Structure
```
modules/project/
├── schemas.ts           # createProjectSchema, updateProjectSchema, types
├── policies.ts          # ProjectPolicy.canCreate(), canRead(), etc
├── repository.ts        # ProjectRepository: CRUD + workspace scoping
├── service.ts           # ProjectService: auth + business logic
├── types.ts             # TypeScript interfaces (if needed)
└── create-action.ts     # Server action: form handler
```

### 4. Three Essential Patterns

#### Pattern 1: Server Action
```typescript
'use server';

export async function createProject(
  workspaceId: string,
  formData: FormData
): Promise<ActionResult<Project>> {
  // 1. Authenticate
  const user = await requireUser();
  
  // 2. Validate input
  const input = parseFormData(createProjectSchema, {
    name: formData.get('name'),
    description: formData.get('description'),
  });
  if (!input.success) return input;
  
  // 3. Resolve tenant
  const tenant = await resolveTenantContext(workspaceId);
  if (!tenant) return errorResult('Access denied');
  
  // 4. Call service
  const service = new ProjectService(tenant);
  try {
    const project = await service.createProject(input.data);
    return successResult(project, 'Project created');
  } catch (err) {
    if (err instanceof ForbiddenError) return errorResult(err.message);
    if (err instanceof NotFoundError) return errorResult(err.message);
    if (err instanceof ValidationError) return errorResult(err.message);
    throw err;
  }
}
```

#### Pattern 2: Service with Authorization
```typescript
export class ProjectService {
  private repo: ProjectRepository;
  
  constructor(private tenant: TenantContext) {
    this.repo = new ProjectRepository(tenant);
  }
  
  async createProject(input: CreateProjectInput) {
    // 1. Check authorization FIRST
    if (!ProjectPolicy.canCreate(this.tenant)) {
      throw new ForbiddenError('Cannot create projects');
    }
    
    // 2. Data access
    const project = await this.repo.create({
      name: input.name,
      description: input.description,
    });
    
    return project;
  }
}
```

#### Pattern 3: Repository with Workspace Scoping
```typescript
export class ProjectRepository {
  constructor(private tenant: TenantContext) {}
  
  async create(data: CreateProjectData) {
    return await db.project.create({
      data: {
        ...data,
        workspaceId: this.tenant.workspaceId, // Auto-scoped!
      }
    });
  }
  
  async findById(projectId: string) {
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        workspaceId: this.tenant.workspaceId, // Auto-scoped!
      }
    });
    
    if (!project) {
      throw new NotFoundError('Project not found');
    }
    
    return project;
  }
}
```

---

## Error Handling

### Service Throws (Specific Types)
```typescript
// Authorization denied (403)
throw new ForbiddenError('Cannot delete active projects');

// Resource not found (404)
throw new NotFoundError('Project not found');

// Business logic violates constraint (422)
throw new ValidationError('Project name must be unique');
```

### Action Catches and Converts
```typescript
try {
  return await service.operation();
} catch (err) {
  if (err instanceof ForbiddenError) {
    return errorResult(err.message); // 403 equivalent
  }
  if (err instanceof NotFoundError) {
    return errorResult(err.message); // 404 equivalent
  }
  if (err instanceof ValidationError) {
    return errorResult(err.message); // 422 equivalent
  }
  throw err; // Re-throw unexpected errors
}
```

---

## Code Organization

### What Goes Where

| What | Where | Example |
|------|-------|---------|
| Validation Schema | `modules/[domain]/schemas.ts` | `createProjectSchema` |
| TypeScript Types | `modules/[domain]/types.ts` | `ProjectDetail`, `ProjectListItem` |
| Auth Rules | `modules/[domain]/policies.ts` | `ProjectPolicy.canDelete()` |
| DB Queries | `modules/[domain]/repository.ts` | `ProjectRepository.findById()` |
| Auth + Business Logic | `modules/[domain]/service.ts` | `ProjectService.updateProject()` |
| Form Handler | `modules/[domain]/[action].ts` | `createProjectAction` |
| API Handler | `app/api/[domain]/route.ts` | `GET /api/projects/[id]` |

### Imports (Dependency Flow)

```
Action
  ↓ imports
Service → Repository
     ↓    ↓
  Schemas, Policies
         ↓
     Database
```

**Never import upward:** Don't let repositories import from services, etc.

---

## Workspace Isolation Rules

### The @Required Pattern
Every repository method MUST include `workspaceId`:

```typescript
// ❌ DANGER: Cross-tenant data leak!
const project = await db.project.findUnique({
  where: { id: projectId }
});

// ✅ SAFE: Guaranteed workspace-scoped
const project = await db.project.findFirst({
  where: {
    id: projectId,
    workspaceId: this.tenant.workspaceId
  }
});
```

### Why findFirst() not findUnique()?
- `findUnique` requires unique constraint on entire composite key (`id`, `workspaceId`)
- `findFirst` with `where` automatically enforces both conditions
- Result: Safe workspace scoping without modifying Prisma schemas

---

## What Phase-5 Covers

✅ **Covered (Implemented):**
- ActionResult type and helpers (successResult, errorResult, fieldErrorsResult)
- Validation parse helpers (parseFormData, parseFormDataAsync)
- Standard server action pattern
- Standard route handler pattern
- Repository pattern with workspace scoping
- Service pattern with authorization
- Module file structure template
- Error types (ForbiddenError, NotFoundError, ValidationError)
- TenantContext injection pattern
- Policy-based authorization
- Comprehensive documentation
- Review checklist for implementations

❌ **Not Covered (Defer to Phase-6+):**
- Feature UI implementation
- Specific resource CRUD operations
- API endpoint implementations
- Caching strategies
- Rate limiting
- Logging/observability
- Optimistic UI updates
- Real-time features (WebSockets)
- Advanced search/analytics

---

## For Phase-6 (Feature Implementation)

When implementing new features in Phase-6:

### Step 1: Define Schemas
```typescript
// modules/project/schemas.ts
export const createProjectSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
});
```

### Step 2: Define Policies
```typescript
// modules/project/policies.ts
export class ProjectPolicy {
  static canCreate(tenant: TenantContext) {
    return tenant.role !== 'VIEWER';
  }
}
```

### Step 3: Create Repository
```typescript
// modules/project/repository.ts
export class ProjectRepository {
  constructor(private tenant: TenantContext) {}
  
  async create(data: CreateProjectData) {
    return await db.project.create({
      data: { ...data, workspaceId: this.tenant.workspaceId }
    });
  }
}
```

### Step 4: Create Service
```typescript
// modules/project/service.ts
export class ProjectService {
  private repo: ProjectRepository;
  
  constructor(private tenant: TenantContext) {
    this.repo = new ProjectRepository(tenant);
  }
  
  async createProject(input: CreateProjectInput) {
    if (!ProjectPolicy.canCreate(this.tenant)) {
      throw new ForbiddenError('Cannot create projects');
    }
    return await this.repo.create(input);
  }
}
```

### Step 5: Create Action
```typescript
// modules/project/create-action.ts
'use server';

export async function createProjectAction(
  workspaceId: string,
  formData: FormData
): Promise<ActionResult<Project>> {
  const user = await requireUser();
  const input = parseFormData(createProjectSchema, formData);
  if (!input.success) return input;
  
  const tenant = await resolveTenantContext(workspaceId);
  if (!tenant) return errorResult('Access denied');
  
  const service = new ProjectService(tenant);
  try {
    const project = await service.createProject(input.data);
    return successResult(project, 'Project created');
  } catch (err) {
    if (err instanceof ForbiddenError) return errorResult(err.message);
    if (err instanceof NotFoundError) return errorResult(err.message);
    if (err instanceof ValidationError) return errorResult(err.message);
    throw err;
  }
}
```

### Step 6: Create UI Component
```typescript
// app/(dashboard)/workspace/[id]/projects/page.tsx
import { createProjectAction } from '@/modules/project/create-action';
import { ProjectForm } from '@/components/project/project-form';

export default async function ProjectsPage({ params }) {
  const tenant = await requireUser(); // Or resolveTenantContext
  
  return (
    <ProjectForm action={createProjectAction.bind(null, params.id)} />
  );
}
```

---

## Testing Phase-5 Patterns

### Unit Test Example (Service)
```typescript
// __tests__/services/project.test.ts
describe('ProjectService', () => {
  it('throws ForbiddenError when user cannot create', () => {
    const tenant = { 
      userId: 'user1', 
      workspaceId: 'ws1', 
      role: 'VIEWER' 
    };
    const service = new ProjectService(tenant);
    
    expect(() => service.createProject({ name: 'Test' }))
      .toThrow(ForbiddenError);
  });
});
```

### Integration Test Example (Action)
```typescript
// __tests__/actions/project.test.ts
describe('createProjectAction', () => {
  it('returns field errors on validation failure', async () => {
    const result = await createProjectAction('ws1', {
      get: () => '', // Empty name
    } as FormData);
    
    expect(result.success).toBe(false);
    expect(result.fieldErrors?.name).toBeDefined();
  });
});
```

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Missing workspaceId in Query
```typescript
// WRONG - Cross-tenant data leak!
const project = await db.project.findUnique({
  where: { id: projectId }
});
```

**Fix:**
```typescript
// CORRECT
const project = await db.project.findFirst({
  where: {
    id: projectId,
    workspaceId: this.tenant.workspaceId
  }
});
```

### ❌ Mistake 2: Authorization Check After Data Access
```typescript
// WRONG - Information leak (404 vs 403)
async getProject(projectId: string) {
  const project = await this.repo.findById(projectId);
  
  if (!ProjectPolicy.canRead(this.tenant)) {
    throw new ForbiddenError('Cannot read');
  }
  
  return project;
}
```

**Fix:**
```typescript
// CORRECT - Check authorization first
async getProject(projectId: string) {
  if (!ProjectPolicy.canRead(this.tenant)) {
    throw new ForbiddenError('Cannot read');
  }
  
  return await this.repo.findById(projectId);
}
```

### ❌ Mistake 3: Direct Prisma Calls from Service
```typescript
// WRONG - Bypasses repository workspace scoping
async createProject(data: CreateProjectInput) {
  return await db.project.create({ data });
}
```

**Fix:**
```typescript
// CORRECT - Uses repository
async createProject(data: CreateProjectInput) {
  return await this.repo.create(data);
}
```

### ❌ Mistake 4: Silent Error Swallowing
```typescript
// WRONG - Error gets lost
export async function createProject(formData: FormData) {
  try {
    const input = parseFormData(schema, formData);
    // Use input without checking success
  } catch (err) {
    // Silent error - bad!
  }
}
```

**Fix:**
```typescript
// CORRECT - Check result before use
export async function createProject(formData: FormData) {
  const input = parseFormData(schema, formData);
  if (!input.success) return input; // Return errors to client
  
  // Now safe to use input.data
}
```

---

## Success Criteria

Phase-5 is complete when:

✅ All existing modules follow the pattern  
✅ All new modules use the template structure  
✅ Every repository query includes `workspaceId`  
✅ Every service checks authorization first  
✅ Every action uses `parseFormData()` → `resolveTenantContext()` → service pattern  
✅ No duplicate Zod schemas across the codebase  
✅ No direct Prisma calls outside repositories  
✅ All errors caught and handled appropriately  
✅ Team trained on patterns and conventions  
✅ Code review checklist enforces patterns  

---

## Reference Files

| Document | Purpose |
|----------|---------|
| [phase-5-architecture.md](./phase-5-architecture.md) | Comprehensive architecture guide |
| [phase-5-review-checklist.md](./phase-5-review-checklist.md) | Implementation verification checklist |
| [decisions.md](./decisions.md) | Why we chose each pattern |
| [architecture.md](./architecture.md) | Overall system architecture |
| `modules/_template/` | Template files for new modules |

---

## Next Steps (Phase-6)

With Phase-5 patterns in place, Phase-6 can focus on feature implementation:

1. **Workspace Management UI** - Create workspace, invite members, manage roles
2. **Project Management UI** - Create/read/update/delete projects
3. **Task Management UI** - Full task workflow (CRUD, status changes, assignments)
4. **Dashboard** - Analytics, quick actions, recent activity
5. **Comments & Notifications** - Task discussions and user alerts
6. **Approvals** - Task approval workflow UI

All will use the Phase-5 patterns established here, ensuring consistency and maintainability.
