# Project Creation Bug - Manual Testing & Debugging Guide

## Overview

This guide provides step-by-step instructions to test project creation and identify the root cause of the "Cannot create projects" error.

---

## Part 1: Pre-Testing Setup

### 1.1 Start the Development Server

```bash
cd c:\flowforge\flowforge
npm run dev
```

The server should start on `http://localhost:3000` and output something like:
```
▲ Next.js 16.2.1 (Turbopack)
- Local:         http://localhost:3000
✓ Ready in ...ms
```

Keep this terminal open and watch for log output.

### 1.2 Clean Database (Optional, for fresh testing)

If you want to test with a clean database:

```bash
npx prisma migrate reset --force
```

This will:- Drop the database
- Recreate the schema
- Run migrations
- Run seed scripts (if any)

---

## Part 2: Test the Flow

### Step 2.1: Sign Up

1. Open `http://localhost:3000` in browser
2. Go to `/sign-up` page
3. Fill in:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "Password123"
   - Confirm: "Password123"
4. Click "Sign Up"

**Expected Result:**
- Account created
- Auto-signed in
- Redirected to `/workspace`
- See "No workspaces yet" message

**Check Server Logs:**
- Look for any errors
- Should be clean with no auth errors

---

### Step 2.2: Create Workspace

1. On `/workspace` page, click "Create Workspace"
2. Fill in:
   - Workspace Name: "My Test Workspace"
3. Click "Create Workspace"

**Expected Result:**
- Workspace created
- Redirected to `/workspace/{workspaceId}`
- See workspace overview page

**Check Server Logs:**
- Look for workspace creation logs
- Should connect to database without errors

**Check Database:**
```bash
npx prisma studio
```
Then:
- Navigate to Workspaces table
- Verify the workspace exists with name "My Test Workspace"
- Navigate to WorkspaceMember table
- Find the entry where userId = your user ID and workspaceId = the workspace ID
- **CRITICAL**: Verify the `role` field is set to `"OWNER"` (uppercase)

---

### Step 2.3: Attempt Project Creation

1. After workspace is created, you should be redirected to the workspace page
2. Click "Projects" in the sidebar or look for a "Projects" section
3. Look for "+ New Project" button
4. Click it
5. Fill in:
   - Project Name: "Test Project"
   - Description: "Test Description"
   - Due Date: (leave blank for now)
6. Click "Create Project"

**Expected Result:**
- Project created successfully
- See project in projects list

**If Error Occurs:**
- Error message: "Cannot create projects"
- This is the bug we're investigating

---

## Part 3: Diagnostic Log Analysis

When the error occurs, look at the dev server terminal for these logs:

### 3.1 Look for Authentication Logs

```
[Project Action] Starting project creation for workspace: {workspaceId}
[Project Action] Step 1: Authenticate user
[Project Action] User authenticated: {userId} {email}
```

**If these don't appear:**
- There might be a network error
- The action might not have been called
- Check browser console for any fetch errors

**If you see:**
- "User authenticated: undefined" → Authentication failed
- No logs at all → Action might not be called

---

### 3.2 Look for Tenant Resolution Logs

```
[Project Action] Step 2: Resolve tenant context
[resolveTenantContext] Resolved: { userId: '...', workspaceId: '...', role: 'OWNER', roleType: 'string' }
[Project Action] Tenant context: OWNER in workspace {workspaceId}
```

**Critical values to check:**

```javascript
{
  userId: string (should not be empty),
  workspaceId: string (should match the workspace you're in),
  role: 'OWNER' or 'MEMBER' or 'MANAGER' or 'VIEWER' (should be uppercase),
  roleType: 'string' (should be string, not undefined)
}
```

**If you see:**
- `role: undefined` or `role: null` → **ROOT CAUSE FOUND**: Role not set in database
- `role: 'owner'` (lowercase) → **ROOT CAUSE FOUND**: Enum value mismatch
- `Resolved: null` → User is not in workspace members
- `userId: undefined` → User not authenticated

---

### 3.3 Look for Permission Check Logs

```
[ProjectPolicy.canCreate] Input tenant: { userId: '...', workspaceId: '...', role: 'OWNER', roleType: 'string' }
[Permission Check] { 
  role: 'OWNER',
  resource: 'PROJECT',
  action: 'CREATE_PROJECT',
  result: true,
  roleExists: true,
  resourceExists: true,
  roleKeys: [ 'OWNER', 'MANAGER', 'MEMBER', 'VIEWER' ]
}
[ProjectPolicy.canCreate] Result: true
```

**Expected:**
- `result: true` → Permission granted
- If `result: false`, check:
  - Is the role in roleKeys list?
  - Is roleExists true?
  - Is resourceExists true?

**If result is false but should be true:**
- Role is one of the keys but action isn't in the Set
- This would suggest role matrix misconfiguration

---

### 3.4 Look for Success or Error Logs

**Success:**
```
[Project Action] Step 5: Create project in database
[Project Action] Project created: {projectId} My Test Project
[Project Action] SUCCESS: Project creation completed
```

**Error:**
```
[Project Action] CAUGHT ERROR: ForbiddenError: Cannot create projects
```

---

## Part 4: Root Cause Identification

Based on the logs you see, identify which scenario applies:

### Scenario 1: "Workspace access denied"

**Logs show:**
```
[Project Action] Tenant context: Not found
[Project Action] ERROR: Workspace access denied
```

**Root Cause:** User is not a member of the workspace

**Fix:**
```bash
npx prisma studio
# Add user to WorkspaceMember table manually
# userId: your user ID
# workspaceId: your workspace ID  
# role: 'OWNER'
```

---

### Scenario 2: Role is undefined

**Logs show:**
```
[resolveTenantContext] Resolved: { ..., role: undefined, roleType: 'undefined' }
```

**Root Cause:** WorkspaceMember.role is NULL in database

**Fix:**
```bash
npx prisma studio
# Find WorkspaceMember records
# Update any with role=null to role='OWNER' (or appropriate role)
```

Or via SQL:
```sql
UPDATE "WorkspaceMember" SET role = 'OWNER' WHERE role IS NULL;
```

---

### Scenario 3: Role is lowercase

**Logs show:**
```
[resolveTenantContext] Resolved: { ..., role: 'owner', roleType: 'string' }
```

**Root Cause:** Role stored as lowercase but enum expects uppercase

**Fix:**
```bash
npx prisma studio
# Find entries with role='owner', 'member', etc (lowercase)
# Update to uppercase: 'OWNER', 'MEMBER', etc
```

Or via SQL:
```sql
UPDATE "WorkspaceMember" SET role = UPPER(role) WHERE role IS NOT NULL;
```

---

### Scenario 4: Permission check returns false despite correct role

**Logs show:**
```
[ProjectPolicy.canCreate] Result: false
[Permission Check] { role: 'OWNER', ..., result: false, roleExists: true }
```

**Root Cause:** Role matrix doesn't have the action for this role

**Fix:**
1. Check `lib/permissions/role-matrix.ts` line 70-85
2. Verify OWNER role includes CREATE_PROJECT:
   ```typescript
   OWNER: {
     [Resource.PROJECT]: new Set([
       Action.CREATE_PROJECT,  // <-- Must be here
       ...
     ]),
   }
   ```

---

## Part 5: Verification After Fix

Once you've applied a fix:

### 5.1 Check Database Again

```bash
npx prisma studio
# Navigate to WorkspaceMember
# Verify the record has:
# - userId: your user ID
# - workspaceId: your workspace ID
# - role: 'OWNER' (uppercase, not null)
```

### 5.2 Try Project Creation Again

1. Go back to browser
2. Try clicking "+ New Project" again
3. Check server logs for success messages

**Expected success logs:**
```
[Project Action] Step 5: Create project in database
[Project Action] Project created: {projectId} {projectName}
[Project Action] SUCCESS: Project creation completed
```

### 5.3 Rebuild (if code was modified)

```bash
npm run build
```

Should complete successfully with 0 errors:
```
✓ Compiled successfully in X.Xs
✓ Finished TypeScript in X.Xs
```

---

## Part 6: Common Issues and Solutions

| Issue | Symptoms | Solution |
|-------|----------|----------|
| Database not migrated | Tables don't exist | `npx prisma migrate dev` |
| Invalid role value | Logs show wrong format | Update database to uppercase |
| User not in workspace | "Workspace access denied" error | Add to WorkspaceMember table |
| Session expired | Redirected to /sign-in | Sign in again |
| Server not reloaded | Changes not reflected | Restart `npm run dev` |
| TypeScript errors | Build fails | Check build output for specific errors |

---

## Part 7: Collect All Information

If you can't identify the issue from the logs, collect this information:

1. **Browser Console Output** (DevTools → Console tab)
2. **Server Terminal Logs** (from `npm run dev`)
3. **Exact sequence of steps you took**
4. **Database state**  
   ```bash
   npx prisma studio
   # Screenshot of WorkspaceMember entry
   ```
5. **Browser URL** at the time of error
6. **Complete error message** from the UI or console

---

## Next Steps

1. Follow the testing procedure above
2. Capture the logs from the server terminal
3. Use the "Root Cause Identification" section to match your logs to a scenario
4. Apply the fix for your scenario
5. Verify the fix works
6. If you can't identify the issue, provide all the information from Part 7

This guide provides comprehensive diagnostics to identify the exact problem and fix it.
