# Phase-5: Shared Patterns Review Checklist

## Overview
This checklist verifies that Phase-5 patterns are correctly implemented across all modules.

---

## Module Structure Checklist

For each module (`modules/[domain]/`), verify:

### Schemas (`schemas.ts`)
- [ ] File exists and is in `modules/[domain]/schemas.ts`
- [ ] Exports Zod schemas: `create[Resource]Schema`, `update[Resource]Schema`
- [ ] Exports TypeScript types: `Create[Resource]Input`, `Update[Resource]Input`
- [ ] Schemas include proper validation messages
- [ ] Schemas follow naming convention (camelCase for create/update)
- [ ] Example: `modules/project/schemas.ts` exports `createProjectSchema`

### Policies (`policies.ts`)
- [ ] File exists and is in `modules/[domain]/policies.ts`
- [ ] Exports `[Resource]Policy` class or object
- [ ] Includes `can[Action]()` static methods: `canCreate`, `canRead`, `canUpdate`, `canDelete`
- [ ] Methods accept `TenantContext` parameter
- [ ] Methods return boolean
- [ ] Methods check role from `tenant.role`
- [ ] Example: `ProjectPolicy.canUpdate(tenant)` returns `tenant.role !== 'VIEWER'`

### Repository (`repository.ts`)
- [ ] File exists and is in `modules/[domain]/repository.ts`
- [ ] Exports `[Resource]Repository` class
- [ ] Constructor accepts `TenantContext`
- [ ] ALL queries include `workspaceId: this.tenant.workspaceId` in `where` clause
- [ ] Methods throw `NotFoundError` if resource not found or wrong workspace
- [ ] No authorization logic (policies are in service)
- [ ] No business logic (just database operations)
- [ ] Returns raw database objects (no transformation)
- [ ] Example: `new ProjectRepository(tenant).findById(id)` throws if wrong workspace

### Service (`service.ts`)
- [ ] File exists and is in `modules/[domain]/service.ts`
- [ ] Exports `[Resource]Service` class
- [ ] Constructor accepts `TenantContext`
- [ ] Constructor creates internal repository instance: `this.repo = new ProjectRepository(tenant)`
- [ ] Methods check authorization FIRST (before any repository calls)
- [ ] Authorization checks throw `ForbiddenError` with clear message
- [ ] Methods call repository for data access
- [ ] Methods catch repository NotFoundError and re-throw
- [ ] Methods detect business logic violations and throw `ValidationError`
- [ ] Methods never call database directly (only through repository)
- [ ] Example flow: `canUpdate → repo.findById → validateBusinessRules → repo.update`

### Types (`types.ts`) - if needed
- [ ] File exists and is in `modules/[domain]/types.ts`
- [ ] Exports TypeScript interfaces for domain model
- [ ] Interfaces match Prisma schema
- [ ] Interfaces used by components and utility functions

### Server Actions (`[action-name].ts`) - if exists
- [ ] File exists if module has form actions
- [ ] `'use server'` directive at top
- [ ] Calls `requireUser()` to ensure authentication
- [ ] Calls `parseFormData()` to validate input
- [ ] Returns `ActionResult` immediately if validation fails
- [ ] Calls `resolveTenantContext()` to check workspace membership
- [ ] Returns error if tenant context is null
- [ ] Creates service with tenant context
- [ ] Calls service method
- [ ] Catches specific errors: `ForbiddenError`, `NotFoundError`, `ValidationError`
- [ ] Returns `successResult()` on success
- [ ] Returns `errorResult()` on error
- [ ] Never catches unexpected errors silently

---

## Data Flow Checklist

Verify the complete request flow for a sample operation:

### Create Operation (form submission)
- [ ] HTML form in component calls `createProjectAction`
- [ ] Action has `'use server'` directive
- [ ] Action calls `requireUser()` - ensure authentication
- [ ] Action calls `parseFormData(createProjectSchema, formData)` - validate input
- [ ] Action checks schema result, return if invalid
- [ ] Action calls `resolveTenantContext(workspaceId)` - check membership
- [ ] Action checks tenant result, return error if null
- [ ] Action instantiates `ProjectService(tenant)` - with scoped context
- [ ] Action calls `service.createProject(validated.data)`
- [ ] Service checks `ProjectPolicy.canCreate(tenant)` - authorize first
- [ ] Service calls `this.repo.create(data)` - repository call
- [ ] Repository wraps in `workspaceId: this.tenant.workspaceId`
- [ ] Database creates record and returns
- [ ] Repository returns raw object
- [ ] Service returns object to action
- [ ] Action returns `successResult(object, message)`
- [ ] Result with `success: true` sent to client

### Read Operation (list/detail)
- [ ] Page calls `service.listProjects()` in server component
- [ ] Server component instantiates `ProjectService(tenant)`
- [ ] Service calls `this.repo.findMany()` - no authorization check needed (or canRead)
- [ ] Repository queries with `workspaceId: this.tenant.workspaceId`
- [ ] Database returns collection
- [ ] Service returns to server component
- [ ] Component renders with data

### Update Operation
- [ ] Form calls `updateProjectAction`
- [ ] Action validates with schema
- [ ] Action resolves tenant
- [ ] Action creates service
- [ ] Service checks `ProjectPolicy.canUpdate(tenant)` - FIRST
- [ ] Service calls `this.repo.update(id, data)`
- [ ] Repository includes `workspaceId` in update where clause
- [ ] Service checks business logic before/after update
- [ ] Returns updated object

### Delete Operation
- [ ] Form/button calls `deleteProjectAction`
- [ ] Action resolves tenant
- [ ] Action creates service
- [ ] Service checks `ProjectPolicy.canDelete(tenant)` - FIRST
- [ ] Service validates business logic (e.g., not referenced by other entities)
- [ ] Service calls `this.repo.delete(id)`
- [ ] Repository includes `workspaceId` in delete where clause
- [ ] Database deletes record
- [ ] Service returns success

---

## Workspace Isolation Verification

For each repository method, check:

### findById / findUnique
```typescript
// ❌ WRONG
const project = await db.project.findUnique({
  where: { id: projectId }
});

// ✅ CORRECT
const project = await db.project.findFirst({
  where: {
    id: projectId,
    workspaceId: this.tenant.workspaceId
  }
});
```

### findMany / find
```typescript
// ❌ WRONG
const projects = await db.project.findMany({
  where: { ownerId: teamMemberId }
});

// ✅ CORRECT
const projects = await db.project.findMany({
  where: {
    ownerId: teamMemberId,
    workspaceId: this.tenant.workspaceId
  }
});
```

### update
```typescript
// ❌ WRONG
const project = await db.project.update({
  where: { id: projectId },
  data: { name: newName }
});

// ✅ CORRECT
const project = await db.project.update({
  where: {
    id: projectId,
    workspaceId: this.tenant.workspaceId
  },
  data: { name: newName }
});
```

### delete
```typescript
// ❌ WRONG
await db.project.delete({
  where: { id: projectId }
});

// ✅ CORRECT
await db.project.delete({
  where: {
    id: projectId,
    workspaceId: this.tenant.workspaceId
  }
});
```

---

## Error Handling Verification

### In Service Layer
- [ ] First line: Authorization check with `if (!Policy.canAction(tenant)) throw new ForbiddenError(...)`
- [ ] Throw `ForbiddenError` with clear message about what's forbidden
- [ ] Throw `NotFoundError` if repository returns null or throws
- [ ] Throw `ValidationError` if business logic constraint violated
- [ ] Never catch errors silently
- [ ] Never return null for "not found" scenarios

### In Server Action
- [ ] try-catch wraps service call
- [ ] Separate catch blocks for: `ForbiddenError`, `NotFoundError`, `ValidationError`
- [ ] Each error type returns `errorResult(message)`
- [ ] Unexpected errors re-thrown with `throw err`
- [ ] No silent failures

### In Route Handler
- [ ] Check authentication with `requireUser()`
- [ ] Validate input with Zod
- [ ] Return 400 if validation fails
- [ ] Resolve tenant context
- [ ] Return 403 if not member
- [ ] Catch service errors and map to HTTP status
- [ ] ForbiddenError → 403 response
- [ ] NotFoundError → 404 response
- [ ] ValidationError → 422 response
- [ ] Unexpected errors → 500 with logging

---

## Action Result Usage

### sucessResult()
- [ ] Used when operation succeeds
- [ ] Syntax: `successResult(data, "optional message")`
- [ ] Data optional (ok to omit for delete operations)
- [ ] Message should be user-facing (past tense: "Project created", "Member removed")

### errorResult()
- [ ] Used for expected errors only (service throws specific errors)
- [ ] Syntax: `errorResult("user-facing message")`
- [ ] Message should explain what went wrong
- [ ] Examples: "Cannot delete active projects", "Access denied", "Email already in use"

### fieldErrorsResult()
- [ ] Used by `parseFormData()` helper - don't call directly
- [ ] Returns when Zod validation fails
- [ ] Includes individual field error messages

---

## Authorization Pattern Verification

### Policy Checks
- [ ] All policy methods are static (no instance needed)
- [ ] All policy methods accept `TenantContext` as parameter
- [ ] All policy methods return `boolean`
- [ ] Policy methods check `tenant.role` enum values
- [ ] Policy is imported and called first thing in service method
- [ ] Service throws `ForbiddenError` if policy denies

### Example:
```typescript
// policies.ts
export class ProjectPolicy {
  static canCreate(tenant: TenantContext): boolean {
    return tenant.role !== 'VIEWER'; // MEMBER, MANAGER, OWNER can create
  }
  
  static canDelete(tenant: TenantContext): boolean {
    return tenant.role === 'OWNER'; // Only OWNER can delete
  }
}

// service.ts
async deleteProject(projectId: string) {
  if (!ProjectPolicy.canDelete(this.tenant)) {
    throw new ForbiddenError('Only workspace owners can delete projects');
  }
  
  return await this.repo.delete(projectId);
}
```

---

## Type Safety Checklist

- [ ] All schema inputs export TypeScript type with `z.infer`
- [ ] Service methods accept typed inputs: `CreateProjectInput`, not `any`
- [ ] Repository methods are typed: `async create(data: CreateData): Promise<Project>`
- [ ] All database objects are typed via Prisma
- [ ] Server actions return `Promise<ActionResult<T>>` with specific T
- [ ] Route handlers return `NextResponse` with typed JSON

---

## Documentation Checklist

- [ ] Module has clear comments explaining responsibility
- [ ] Schema comments explain each field requirement
- [ ] Policy methods have comments explaining authorization rules
- [ ] Repository comments note workspace scoping
- [ ] Service comments explain flow: auth → repo → return
- [ ] Action comments show example form structure
- [ ] Complex logic has inline comments

---

## Testing Readiness

For each module service, verify it's testable:

- [ ] Constructor accepts `TenantContext` (mockable)
- [ ] Uses repository (mockable)
- [ ] No direct database calls
- [ ] Methods throw specific errors
- [ ] Methods can be called with different tenant contexts
- [ ] Business logic is pure (same input = same output)

---

## Phase-5 Completion Criteria

✅ **All modules follow the 5-layer pattern:**
- Pages → Actions → Validation → Services → Repositories → Database

✅ **All repository queries are workspace-scoped:**
- Every query includes `workspaceId: this.tenant.workspaceId`

✅ **All services check authorization first:**
- First line of business methods: authorization check

✅ **All actions follow standard pattern:**
- requireUser → parseFormData → resolveTenantContext → service → return ActionResult

✅ **All errors are specific types:**
- ForbiddenError (403), NotFoundError (404), ValidationError (422)

✅ **Validation is centralized:**
- Schemas defined once in `schemas.ts`
- Imported by actions and services
- No duplicated validation logic

✅ **Modules are organized consistently:**
- All folders have: schemas, policies, repository, service, types
- Clear ownership (who imports what)
- Easy for new developers to navigate

---

## Sign-Off

**Phase-5 Complete when:**
- [ ] All modules follow patterns
- [ ] All checklist items verified
- [ ] No database calls outside repositories
- [ ] No authorization skipped
- [ ] No duplicated validation
- [ ] Documentation updated
- [ ] Team trained on patterns
