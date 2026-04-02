# Project Creation Bug - Diagnostic Report

## Issue Summary

**Error:** "Cannot create projects" when attempting to create a new project in the workspace projects page.

**Error Occurs At:** `ProjectService.createProject()` → `ProjectPolicy.canCreate()` returns false → throws `ForbiddenError('Cannot create projects')`

**Impact:** Users cannot create projects, blocking all project-dependent features (tasks, comments, dependencies, etc.)

---

## Root Cause Analysis

The permission check in `ProjectPolicy.canCreate()` is returning false for users who should be able to create projects.

### Code Flow

```
CreateProjectForm (client)
  ↓ submits form
createProjectAction (server action)
  ↓ calls resolveTenantContext(workspaceId, user.id)
Returns TenantContext with role field
  ↓ if (!tenant) return error
  ↓ creates ProjectService(tenant)
ProjectService.createProject()
  ↓ calls ProjectPolicy.canCreate(this.tenant)
ProjectPolicy.canCreate()
  ↓ calls canPerform(tenant.role, Resource.PROJECT, Action.CREATE_PROJECT)
canPerform() returns false ❌
  ↓ throws ForbiddenError('Cannot create projects')
```

### Why It Should Work

1. **Role Matrix:** The `MEMBER` and `OWNER` roles both have `Action.CREATE_PROJECT` permission
   - Location: `lib/permissions/role-matrix.ts` lines 153-165 and 73-85

2. **Default Role:** When a workspace is created, the creator is added as `OWNER` role
   - Location: `modules/workspace/repository.ts` line 166 (sets `role: 'OWNER'`)

3. **Type Compatibility:** `WorkspaceRole` enum matches the role matrix keys

---

## Diagnostic Changes Added

I've added comprehensive logging throughout the permission checking system to help identify the exact issue.

### 1. resolveTenantContext Logging

**File:** `lib/tenant/resolve-tenant.ts`

```typescript
console.log('[resolveTenantContext] Resolved:', {
  userId: context.userId,
  workspaceId: context.workspaceId,
  role: context.role,          // The actual value from database
  roleType: typeof context.role, // Should be "string"
});
```

### 2. ProjectPolicy.canCreate Logging

**File:** `modules/project/policies.ts`

```typescript
console.log('[ProjectPolicy.canCreate] Input tenant:', {
  userId: tenant.userId,
  workspaceId: tenant.workspaceId,
  role: tenant.role,           // Value being checked
  roleType: typeof tenant.role, // Type verification
});
console.log('[ProjectPolicy.canCreate] Result:', result); // true or false
```

### 3. canPerform Logging

**File:** `lib/permissions/role-matrix.ts`

```typescript
console.log('[Permission Check]', { 
  role: role || 'UNDEFINED', 
  resource, 
  action, 
  result,
  roleExists: !!roleMatrix[role],
  resourceExists: !!roleMatrix[role]?.[resource],
  roleKeys: Object.keys(roleMatrix) // All available roles
});
```

---

## How to Investigate

### Step 1: Check Server Logs

When project creation fails, check the terminal running `npm run dev` for these log entries:

```
[resolveTenantContext] Resolved: { userId: '...', workspaceId: '...', role: ?, roleType: ? }
[ProjectPolicy.canCreate] Input tenant: { userId: '...', workspaceId: '...', role: ?, roleType: ? }
[Permission Check] { role: ?, resource: 'PROJECT', action: 'CREATE_PROJECT', result: false, ... }
```

### Step 2: Verify Database State

Check if the user's WorkspaceMember record exists:

```bash
npx prisma studio
```

Then:
1. Navigate to the WorkspaceMember table
2. Find the entry where userId matches the logged userId and workspaceId matches the logged workspaceId
3. Verify the `role` field has a value (should be `OWNER` if they created the workspace, or `MEMBER`/`MANAGER`/`VIEWER` if invited)

### Step 3: Analyze Logs

The logs will show:

- **If resolveTenantContext returns null:** The user is not a member of the workspace
  - Expected log: `Resolved: null`
  - Fix: Add user to workspace

- **If role is undefined/null:** The WorkspaceMember record exists but role is not set
  - Expected log: `role: undefined` or `role: null`
  - Fix: Check database for null role values

- **If role is a value but result is false:** The role isn't in the matrix or doesn't have the action
  - Expected log: `result: false` with `roleExists: false` or that value isn't in the role matrix
  - Fix: Check role matrix configuration or database role value

- **If all logs look correct but result is still false:** Check the exact role string value
  - Possible issue: Role is `'member'` (lowercase) instead of `'MEMBER'` (uppercase)
  - Fix: Ensure database role matches enum values exactly

---

## Possible Root Causes

### 1. Role is Not Set in Database

**Evidence:** `[resolveTenantContext]` shows `role: null` or `role: undefined`

**Solution:** 
```sql
UPDATE "WorkspaceMember" SET role = 'MEMBER' WHERE role IS NULL;
```

### 2. Role Value Mismatch

**Evidence:** `[resolveTenantContext]` shows `role: "member"` but error still occurs

**Solution:** Update the database to use uppercase enum values:
```sql
UPDATE "WorkspaceMember" SET role = 'MEMBER' WHERE role = 'member';
UPDATE "WorkspaceMember" SET role = 'OWNER' WHERE role = 'owner';
```

### 3. User Not in Workspace Members

**Evidence:** `[resolveTenantContext]` shows `Resolved: null`

**Solution:**
```bash
# Use Prisma studio to manually add the user to the workspace
npx prisma studio
# Navigate to WorkspaceMember table
# Create new record with userId, workspaceId, and role='MEMBER'
```

### 4. Enum Type Mismatch in Prisma

**Evidence:** Logs show role value but it's not recognized in roleMatrix

**Solution:** Regenerate Prisma client:
```bash
npx prisma generate
```

---

## Testing the Fix

After identifying and fixing the root cause:

1. **Verify Database:**
   ```bash
   npx prisma studio
   # Check WorkspaceMember record
   # Ensure role='OWNER' or role='MEMBER' (uppercase)
   ```

2. **Check Build:**
   ```bash
   npm run build
   # Should complete successfully with 0 errors
   ```

3. **Test in Browser:**
   ```bash
   npm run dev
   # Navigate to workspace projects page
   # Click "+ New Project"
   # Fill in project name
   # Click Create
   # Should succeed without "Cannot create projects" error
   ```

4. **Verify Logs:**
   - Check terminal output has success logs
   - Should see `[Project Action] SUCCESS: Project creation completed`

---

## Files Modified

1. **lib/tenant/resolve-tenant.ts** - Added explicit return type and diagnostic logging
2. **modules/project/policies.ts** - Added detailed logging for permission checks
3. **lib/permissions/role-matrix.ts** - Added comprehensive logging in canPerform function

All changes are purely diagnostic and don't alter business logic. They can be removed after debugging.

---

## Next Steps

1. **Attempt project creation** with the new logging in place
2. **Capture the server logs** (from `npm run dev` terminal)
3. **Check the database** using Prisma studio
4. **Match logs to possible causes** above
5. **Apply the appropriate fix**
6. **Test and verify** the solution works

The diagnostic logging should pinpoint exactly where the issue is occurring and guide toward the correct fix.
