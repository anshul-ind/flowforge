# Authentication vs Authorization Behavior

This document explains the difference between 401 Unauthorized and 403 Forbidden errors, and how FlowForge handles each scenario.

---

## 🔑 **Core Concepts**

### **Authentication (Identity)**
*"Who are you?"*
- Proving identity (login with credentials)
- Session/token validation
- Answer: You are logged in as `user@example.com`

### **Authorization (Permission)**
*"What can you do?"*
- Checking permissions
- Role-based access control
- Workspace membership validation
- Answer: You can view but not edit

---

## 🚦 **HTTP Status Codes**

### **401 UNAUTHORIZED**
**Meaning:** "We don't know who you are"

**Situations:**
- No session exists
- Session expired
- Invalid authentication token
- User not logged in

**User Experience:**
- Automatic redirect to `/sign-in`
- Callback URL preserved
- User can sign in and return to intended page

**Implementation:**
```typescript
// Handled by: middleware.ts
export default auth((req) => {
  const isAuthenticated = !!req.auth;
  
  if (isProtectedRoute && !isAuthenticated) {
    // 401: User not authenticated
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }
});
```

**Example Flow:**
```
User visits: /workspace/abc123
↓
Middleware checks: isAuthenticated?
↓
No session found → 401 Unauthorized
↓
Redirect to: /sign-in?callbackUrl=/workspace/abc123
↓
User signs in → Redirect back to /workspace/abc123
```

---

### **403 FORBIDDEN**
**Meaning:** "We know who you are, but you can't do this"

**Situations:**
- User is authenticated (session exists)
- But lacks permission for the action:
  - Not a member of the workspace
  - Insufficient role (e.g., VIEWER trying to edit)
  - Resource doesn't belong to user's workspace

**User Experience:**
- NO redirect (user is already logged in)
- Show error message
- Suggest actions (request access, contact admin)

**Implementation:**
```typescript
// Handled by: resolveTenantContext()
export default async function WorkspacePage({ params }) {
  const tenant = await resolveTenantContext(params.workspaceId);
  
  if (!tenant) {
    // 403: User authenticated but not a workspace member
    return <AccessDenied message="You don't have access to this workspace" />;
  }
  
  // Role-based permission check
  if (tenant.role === 'VIEWER' && isEditAction) {
    // 403: User is member but insufficient role
    return errorResult('Viewers cannot edit projects');
  }
}
```

**Example Flow:**
```
User visits: /workspace/abc123 (logged in as user@example.com)
↓
Middleware checks: isAuthenticated? → Yes ✓
↓
Page loads, calls: resolveTenantContext('abc123')
↓
Check WorkspaceMember table → No membership found
↓
Return null → 403 Forbidden
↓
Show: "You don't have access to this workspace"
```

---

## 📊 **Decision Matrix**

| Authenticated? | Workspace Member? | Role Sufficient? | Result | Action |
|----------------|-------------------|------------------|--------|--------|
| ❌ No | N/A | N/A | **401** | Redirect to /sign-in |
| ✅ Yes | ❌ No | N/A | **403** | Show "Access Denied" |
| ✅ Yes | ✅ Yes | ❌ No | **403** | Show "Insufficient Permissions" |
| ✅ Yes | ✅ Yes | ✅ Yes | **200** | Allow action |

---

## 🎯 **Implementation Layers**

### **Layer 1: Authentication (middleware.ts)**
```typescript
// Runs FIRST on every request
// Checks: Do you have a valid session?

if (!isAuthenticated) {
  // 401: Redirect to sign-in
  return redirect('/sign-in?callbackUrl=' + currentUrl);
}
```

**Protects:** All `/workspace/*` routes  
**Result:** User must be logged in to proceed

---

### **Layer 2: Workspace Membership (resolveTenantContext)**
```typescript
// Runs in page/action
// Checks: Are you a member of this workspace?

const tenant = await resolveTenantContext(workspaceId);

if (!tenant) {
  // 403: Not a member
  return <div>You don't have access to this workspace</div>;
}
```

**Protects:** Workspace-specific resources  
**Result:** User must be workspace member to view/edit

---

### **Layer 3: Role-Based Authorization**
```typescript
// Runs in action/component
// Checks: Does your role allow this action?

if (tenant.role === 'VIEWER') {
  // 403: Insufficient role
  return errorResult('Viewers cannot perform this action');
}

if (tenant.role !== 'OWNER' && isDeleteWorkspace) {
  // 403: Only owners can delete
  return errorResult('Only workspace owners can delete workspaces');
}
```

**Protects:** Sensitive actions  
**Result:** User must have appropriate role

---

## 🔒 **Security Scenarios**

### **Scenario 1: Anonymous User**
```
Action: Visit /workspace/abc123
↓
Middleware: No session → 401
↓
Redirect: /sign-in?callbackUrl=/workspace/abc123
```

### **Scenario 2: Logged In, Not a Member**
```
Action: Visit /workspace/xyz789
↓
Middleware: Session exists → Pass ✓
↓
Page: resolveTenantContext('xyz789') → null
↓
Result: 403 "You don't have access to this workspace"
```

### **Scenario 3: Member, Insufficient Role**
```
Action: Delete project (requires MANAGER or OWNER)
User Role: VIEWER
↓
Middleware: Session exists → Pass ✓
↓
Page: resolveTenantContext() → tenant (VIEWER)
↓
Action: Check role → VIEWER
↓
Result: 403 "Viewers cannot delete projects"
```

### **Scenario 4: Member Removed Mid-Session**
```
1. User logs in → Session created
2. User visits workspace A → Member ✓
3. Admin removes user from workspace A
4. User refreshes page
↓
Middleware: Session still valid → Pass ✓
↓
Page: resolveTenantContext() → null (no membership)
↓
Result: 403 "You no longer have access to this workspace"
```

---

## 💡 **Why Separate 401 and 403?**

### **User Experience**
- **401:** User might not realize they need to log in → Auto-redirect helps
- **403:** User knows they're logged in → Show error message, don't kick them out

### **Security**
- **401:** Anyone can trigger (just visit protected URL)
- **403:** Only authenticated users can trigger (proves reconnaissance attempt)

### **Logging/Monitoring**
- **401:** Normal behavior (anonymous visitors)
- **403:** Suspicious behavior (logged-in user trying unauthorized access)

---

## 📝 **Error Message Templates**

### **401 Unauthorized**
```typescript
// Automatic redirect - no message needed
// User sees sign-in page
```

### **403 Forbidden - Not a Member**
```typescript
<div>
  <h1>Access Denied</h1>
  <p>You don't have access to this workspace.</p>
  <p>Contact the workspace owner to request access.</p>
  <Button href="/dashboard">Return to Dashboard</Button>
</div>
```

### **403 Forbidden - Insufficient Role**
```typescript
errorResult('You need Manager or Owner role to perform this action')
```

```typescript
<div>
  <p>⚠️ This action requires elevated permissions.</p>
  <p>Your current role: {tenant.role}</p>
  <p>Required role: MANAGER or OWNER</p>
</div>
```

---

## 🧪 **Testing Checklist**

### **401 Tests**
- [ ] Anonymous user visits /workspace/abc → Redirect to /sign-in
- [ ] Expired session visits protected route → Redirect to /sign-in
- [ ] Sign in preserves callback URL → Returns to intended page

### **403 Tests**
- [ ] Logged-in user visits workspace they don't belong to → Show access denied
- [ ] VIEWER tries to delete project → Show insufficient permissions
- [ ] Member removed from workspace → Next request shows access denied
- [ ] User tries to access workspace with invalid ID → Show not found

---

## 🎯 **Best Practices**

### **DO ✅**
- Use middleware for authentication (401)
- Use `resolveTenantContext()` for membership (403)
- Use role checks for fine-grained permissions (403)
- Show helpful error messages for 403
- Log 403 errors (potential security issue)

### **DON'T ❌**
- Don't redirect on 403 (user is already logged in)
- Don't show 403 errors to unauthenticated users (that's 401)
- Don't cache `resolveTenantContext()` results (membership can change)
- Don't skip membership check (security vulnerability)
- Don't expose which workspaces exist in 403 errors (privacy)

---

## 📖 **Code Examples**

### **Protected Page Component**
```typescript
// app/workspace/[workspaceId]/projects/page.tsx
import { resolveTenantContext } from '@/lib/tenant';
import { db } from '@/lib/db';

export default async function ProjectsPage({
  params,
}: {
  params: { workspaceId: string };
}) {
  // Middleware already checked authentication (401)
  
  // Check workspace membership (403)
  const tenant = await resolveTenantContext(params.workspaceId);
  
  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p>You don't have access to this workspace.</p>
        <a href="/dashboard" className="text-blue-600">Return to Dashboard</a>
      </div>
    );
  }
  
  // User is authenticated AND a member
  const projects = await db.project.findMany({
    where: { workspaceId: tenant.workspaceId },
  });
  
  return <div>Projects: {projects.length}</div>;
}
```

### **Protected Server Action**
```typescript
// app/actions/project.actions.ts
'use server';

import { resolveTenantContext } from '@/lib/tenant';
import { db } from '@/lib/db';
import { errorResult, successResult } from '@/types/action-result';

export async function deleteProject(
  workspaceId: string,
  projectId: string
) {
  // Check workspace membership (403)
  const tenant = await resolveTenantContext(workspaceId);
  
  if (!tenant) {
    return errorResult('You don't have access to this workspace');
  }
  
  // Check role permission (403)
  if (tenant.role === 'VIEWER') {
    return errorResult('Viewers cannot delete projects');
  }
  
  // Verify project belongs to workspace (403)
  const project = await db.project.findUnique({
    where: { id: projectId, workspaceId: tenant.workspaceId },
  });
  
  if (!project) {
    return errorResult('Project not found or access denied');
  }
  
  // Perform deletion
  await db.project.delete({
    where: { id: projectId },
  });
  
  return successResult(undefined, 'Project deleted successfully');
}
```

---

## 🔍 **Debugging Tips**

### **User Says: "I can't access the workspace"**

1. **Check authentication:**
   ```typescript
   const session = await getSession();
   console.log('Session:', session); // Is there a session?
   ```

2. **Check membership:**
   ```typescript
   const tenant = await resolveTenantContext(workspaceId);
   console.log('Tenant:', tenant); // Is tenant null?
   ```

3. **Check database:**
   ```sql
   SELECT * FROM "WorkspaceMember" 
   WHERE "userId" = 'user-id' 
   AND "workspaceId" = 'workspace-id';
   ```

### **Common Issues**

| Issue | Symptom | Solution |
|-------|---------|----------|
| Middleware not running | Protected routes accessible without login | Check `middleware.ts` export |
| Wrong session strategy | Session not persisting | Verify `strategy: 'jwt'` in auth.ts |
| Membership not created | All workspaces show 403 | Check WorkspaceMember creation |
| Stale session cache | Removed user still has access | Clear browser cookies |

---

## ✅ **Summary**

| | **401 Unauthorized** | **403 Forbidden** |
|---|---|---|
| **Meaning** | Not authenticated | Authenticated but no permission |
| **Handler** | middleware.ts | resolveTenantContext() |
| **Action** | Redirect to /sign-in | Show error message |
| **When** | No session | Session exists but insufficient access |
| **User State** | Anonymous | Logged in |
| **Can Fix** | Yes (log in) | Maybe (request access) |

---

🎉 **Authentication and authorization behaviors are now clearly defined!**
