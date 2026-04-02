# Phase-5: Shared Patterns Architecture

## Overview

Phase-5 establishes the foundational patterns used by all subsequent features. These patterns ensure:

- **Consistency**: Same structure in every action, route handler, and service
- **Safety**: Tenant isolation enforced at every layer
- **Maintainability**: Clear responsibilities separate concerns
- **Reusability**: Services work with actions, API routes, and background jobs
- **Testability**: Easy to mock repositories and test business logic

---

## Standard Data Flow

Every request follows this pattern:

```
Client Form/API Request
    ↓
Middleware (authentication + tenant context)
    ↓
Page/Component → Server Action / Route Handler
    ↓
Input Validation (Zod) → parseFormData()
    ↓
Tenant Resolution → resolveTenantContext()
    ↓
Service Layer
    ├─ Authorization Check (policies)
    ├─ Business Logic
    └─ Repository Access
    ↓
Repository Layer
    ├─ Workspace-scoped Query
    ├─ Database Operation
    └─ NotFoundError handling
    ↓
Database (PostgreSQL + Prisma)
    ↓
Response (ActionResult / JSON)
```

---

## Layer Responsibilities

### 1. Page/Component Layer
**What it does:** Renders UI, handles user interactions
**Rules:**
- Never call database directly
- Never call Prisma
- Always use server actions or API routes
- Keep components thin

**Example:**
```typescript
// app/(dashboard)/projects/page.tsx
import { createProjectAction } from '@/modules/project/create-action';

export default function ProjectsPage() {
  return (
    <form action={createProjectAction.bind(null, workspaceId)}>
      <input name="name" />
      <button type="submit">Create Project</button>
    </form>
  );
}
```

### 2. Server Action Layer
**What it does:** Receives form data, orchestrates request handling
**Rules:**
- Use `'use server'` directive
- Call `requireUser()` to ensure authentication
- Call `parseFormData()` to validate input
- Call `resolveTenantContext()` to check membership
- Create service with tenant context
- Catch service errors and return `ActionResult`
- Throw errors only for unexpected failures

**Pattern:**
```typescript
'use server';

export async function createProject(
  workspaceId: string,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const input = parseFormData(createProjectSchema, { name: formData.get('name') });
  if (!input.success) return input;

  const tenant = await resolveTenantContext(workspaceId);
  if (!tenant) return errorResult('Access denied');

  const service = new ProjectService(tenant);
  try {
    const project = await service.createProject(input.data);
    return successResult(project, 'Created!');
  } catch (err) {
    if (err instanceof ForbiddenError) return errorResult(err.message);
    // ... handle other errors
  }
}
```

### 3. Validation Layer
**What it does:** Parses and validates untrusted input using Zod
**Rules:**
- Define schemas in `modules/[name]/schemas.ts`
- Never duplicate validation logic
- Use `parseFormData()` helper for server actions
- Use `safeParse()` for non-critical validation

**Pattern:**
```typescript
// modules/project/schemas.ts
export const createProjectSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
```

### 4. Service Layer
**What it does:** Implements business logic, orchestrates authorization and data access
**Rules:**
- Constructor accepts `TenantContext` (auto-scopes all operations)
- Check authorization FIRST (before any DB access)
- Use repository for all data access (never call db directly)
- Throw `ForbiddenError` for authorization failures
- Throw `NotFoundError` if resource doesn't exist
- Throw `ValidationError` for business logic violations
- Return raw database objects

**Pattern:**
```typescript
export class ProjectService {
  private repo: ProjectRepository;

  constructor(private tenant: TenantContext) {
    this.repo = new ProjectRepository(tenant);
  }

  async createProject(input: CreateProjectInput) {
    // Authorization first
    if (!canCreate(this.tenant)) {
      throw new ForbiddenError('Cannot create projects');
    }

    // Data access
    return await this.repo.create({
      name: input.name,
      description: input.description,
    });
  }
}
```

### 5. Repository Layer
**What it does:** Data access operations, workspace scoping
**Rules:**
- Constructor accepts `TenantContext`
- ALWAYS include `workspaceId` in every query's `where` clause
- NO business logic (return raw database objects)
- NO authorization checks (service does that)
- Throw `NotFoundError` if resource not found or wrong workspace
- Never return null (throw NotFoundError instead for expected errors)

**Pattern:**
```typescript
export class ProjectRepository {
  constructor(private tenant: TenantContext) {}

  async findById(projectId: string) {
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        workspaceId: this.tenant.workspaceId, // ALWAYS scope by workspace
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    return project;
  }
}
```

### 6. Database Layer
**What it does:** Stores and retrieves data
**Rules:**
- Use Prisma for all database access
- Never call database directly from pages/actions
- Always accessed through repository

---

## Error Handling

### Service Errors (thrown)
Services throw specific errors that actions/routes catch:

```typescript
// ForbiddenError (403)
throw new ForbiddenError('Cannot delete archived projects');

// NotFoundError (404)
throw new NotFoundError('Project not found');

// ValidationError (422)
throw new ValidationError('Project name already exists');
```

### Action Response (ActionResult)
Actions convert service errors to ActionResult:

```typescript
try {
  const result = await service.deleteProject(projectId);
  return successResult(result, 'Project deleted');
} catch (err) {
  if (err instanceof ForbiddenError) {
    return errorResult(err.message); // 403
  }
  if (err instanceof NotFoundError) {
    return errorResult(err.message); // 404
  }
  if (err instanceof ValidationError) {
    return errorResult(err.message); // 422
  }
  throw err; // Re-throw unexpected errors
}
```

### Validation Errors (parseFormData)
Validation errors return ActionResult directly (never throw):

```typescript
const input = parseFormData(createProjectSchema, data);
if (!input.success) {
  return input; // { success: false, fieldErrors: {...} }
}
```

---

## Workspace Isolation

Every module must enforce workspace isolation at the repository layer:

```typescript
// ✅ CORRECT: Always scoped by workspaceId
const project = await db.project.findFirst({
  where: {
    id: projectId,
    workspaceId: this.tenant.workspaceId,
  },
});

// ❌ WRONG: Missing workspace scope - SECURITY RISK
const project = await db.project.findUnique({
  where: { id: projectId }, // Could return another workspace's project!
});
```

---

## Module File Structure

Each domain module includes:

```
modules/[domain]/
├── schemas.ts       # Zod validation schemas
├── policies.ts      # Authorization rules
├── repository.ts    # Database access (workspace-scoped)
├── service.ts       # Business logic
├── types.ts         # TypeScript interfaces
└── [action].ts      # Server action (if needed)
```

### Example: Projects Module
```
modules/project/
├── schemas.ts       # createProjectSchema, updateProjectSchema
├── policies.ts      # ProjectPolicy.canCreate, canRead, canUpdate, canDelete
├── repository.ts    # ProjectRepository with CRUD methods
├── service.ts       # ProjectService orchestrates auth + repos
├── types.ts         # ProjectListItem, ProjectDetail
├── create-action.ts # createProjectAction - form handler
└── update-action.ts # updateProjectAction - form handler
```

---

## Checklist: Creating a New Module

1. **Define Schemas** (`schemas.ts`)
   - Create input schemas (Create/Update)
   - Create filter schemas for queries
   - Export TypeScript types with `z.infer`

2. **Define Policies** (`policies.ts`)
   - Check role requirements
   - Static methods returning boolean
   - Used by service layer

3. **Create Repository** (`repository.ts`)
   - Constructor accepts `TenantContext`
   - All queries scope by `workspaceId`
   - Return `NotFoundError` if not found
   - No business logic

4. **Create Service** (`service.ts`)
   - Constructor accepts `TenantContext`
   - Check authorization FIRST
   - Use repository for data access
   - Throw proper errors
   - Reusable across actions, routes, jobs

5. **Create Actions** (optional)
   - Use `parseFormData()` for validation
   - Use `resolveTenantContext()` for membership
   - Instantiate service with tenant
   - Catch service errors

6. **Create Route Handlers** (optional)
   - Use `requireUser()` for authentication
   - Validate request body/query
   - Resolve tenant context
   - Instantiate service with tenant
   - Return JSON responses

---

## Benefits of This Architecture

| Benefit | How | Example |
|---------|-----|---------|
| **Tenant Safety** | Always scope by `workspaceId` in repository | No cross-tenant data access |
| **Authorization** | Check in service BEFORE data access | `/workspace/other/projects` returns 403, not 404 |
| **Code Reuse** | Services used by actions, routes, jobs | Same business logic everywhere |
| **Testability** | Mock repository, test service logic | No database needed for tests |
| **Clarity** | Each layer has one responsibility | Easy to find where to make changes |
| **Type Safety** | Zod + TypeScript throughout | Catch errors at compile time |
| **Consistency** | Same pattern in every module | New developers recognize structure |
