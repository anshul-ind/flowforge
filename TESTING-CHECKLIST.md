# 🧪 COMPREHENSIVE TESTING CHECKLIST - PHASE 8 & BEYOND

**Server Status:** ✅ Running on http://localhost:3000  
**Database:** ✅ dueDate migration applied  
**TypeScript:** ✅ 0 errors

---

## 📋 GATE CHECKLIST (12 Items)

### ✅ **ITEM 1: Sign up creates user and auto signs in**

**Steps:**
1. Open http://localhost:3000 in browser
2. Click "Sign Up"
3. Fill in form:
   - Email: `testuser1@example.com`
   - Password: `TestPassword123!`
   - Confirm: `TestPassword123!`
4. Click "Create Account"
5. Verify browser doesn't show sign-in page again
6. Should redirect to workspace/dashboard automatically

**Expected:**
- ✅ User account created in database
- ✅ Session automatically established
- ✅ Redirect to workspace/dashboard (not sign-in page)
- ✅ User email shown in top-right profile menu

**Result:** [ ] PASS | [ ] FAIL

---

### ✅ **ITEM 2: Sign in redirects to callbackUrl**

**Setup:** Sign out first (click profile → Sign out)

**Steps:**
1. You should be redirected to sign-in page
2. Sign in with: `testuser1@example.com` / `TestPassword123!`
3. Verify you're redirected to workspace/dashboard
4. Check browser URL changes from `/auth/sign-in` to `/workspace/[slug]`

**Expected:**
- ✅ Sign-in form accepts credentials
- ✅ After sign-in, redirect happens (not staying on sign-in page)
- ✅ Can access workspace dashboard

**Result:** [ ] PASS | [ ] FAIL

---

### ✅ **ITEM 3: Sign out destroys session and redirects**

**Steps:**
1. While signed in, click profile (top-right "A" button)
2. Click "Sign out"
3. Verify page shows sign-in form
4. Try to manually go to http://localhost:3000/workspace
5. Should redirect back to sign-in

**Expected:**
- ✅ Session destroyed (no session cookie in browser)
- ✅ Redirect to sign-in page after logout
- ✅ Cannot access /workspace without signing in again
- ✅ F12 → Storage → Cookies shows no auth tokens

**Result:** [ ] PASS | [ ] FAIL

---

### ✅ **ITEM 4: Create workspace → slug unique → creator is OWNER**

**Setup:** Signed in as testuser1

**Steps:**
1. On workspace dashboard, click "Create Workspace"
2. Fill in:
   - Name: "Test Workspace #1"
   - Slug: `test-workspace-1`
3. Click "Create"
4. Verify workspace is created
5. Try to create another workspace with same slug
6. Should fail with error like "Slug already taken"

**Expected:**
- ✅ Workspace created with unique slug
- ✅ Creator automatically assigned OWNER role
- ✅ Can verify in Members tab: testuser1 shows as "OWNER"
- ✅ User can see workspace in workspace switcher

**Result:** [ ] PASS | [ ] FAIL

---

### ✅ **ITEM 5: Invite member → role assigned → existing member check**

**Setup:** In workspace created above

**Steps:**
1. Click "Members" tab
2. Click "Invite Member"
3. Enter email: `testmember@example.com`
4. Select role: "EDITOR"
5. Click "Send Invite"
6. Try to invite same user again
7. Should show error like "User already invited"

**Expected:**
- ✅ Invitation sent successfully
- ✅ New member shows with "EDITOR" role
- ✅ Cannot invite same user twice (duplicate check works)
- ✅ Member list shows correct role assignment

**Result:** [ ] PASS | [ ] FAIL

---

### ✅ **ITEM 6: Workspace switcher lists all user workspaces**

**Setup:** Create 2nd workspace to test switcher

**Steps:**
1. Sign in (if not already)
2. Go to http://localhost:3000
3. On dashboard, you should see list of workspaces
4. Click on "Test Workspace #1"
5. Verify you switch to that workspace
6. Create another workspace: "Test Workspace #2"
7. Go back to dashboard - should see both workspaces listed

**Expected:**
- ✅ Dashboard shows all workspaces user has access to
- ✅ Can click workspace to switch context
- ✅ Workspace dropdown/switcher shows all available workspaces
- ✅ Current workspace is highlighted/indicated

**Result:** [ ] PASS | [ ] FAIL

---

### ✅ **ITEM 7: Create project → SLA/dueDate saved → owner auto-set**

**Setup:** In "Test Workspace #1"

**Steps:**
1. Click "Projects" tab
2. Click "Create Project"
3. Fill in:
   - Name: "Q2 Release Sprint"
   - Description: "Major release with new features"
   - **Due Date:** 2026-06-30
4. Click "Create Project"
5. Verify project appears in list
6. Click to open project details
7. Check:
   - Due date shows as "June 30, 2026" or similar
   - Your user is set as project owner
   - Verify in database (Prisma Studio): dueDate field has value

**Expected:**
- ✅ Project created with dueDate field populated
- ✅ Project owner auto-set to current user
- ✅ Can see dueDate in project detail view
- ✅ Prisma Studio shows `dueDate: 2026-06-30T00:00:00.000Z`

**Result:** [ ] PASS | [ ] FAIL

---

### ✅ **ITEM 8: Archive project → status = ARCHIVED → read-only**

**Setup:** Project from ITEM 7

**Steps:**
1. Open "Q2 Release Sprint" project
2. Click "Settings" or options menu
3. Click "Archive Project"
4. Confirm archive
5. Verify project shows as "ARCHIVED" status
6. Try to create a task - should be disabled/readonly
7. Try to edit project name - should be disabled
8. Click taskMenu or details - should show "Read-only"

**Expected:**
- ✅ Project status changes to ARCHIVED
- ✅ Project appears grayed out in projects list
- ✅ Cannot create tasks in archived project
- ✅ Cannot edit project details when archived
- ✅ Archived projects still visible (soft archive, not deleted)

**Result:** [ ] PASS | [ ] FAIL

---

### ✅ **ITEM 9: Create task with all fields including dependencies**

**Setup:** Create new project "Q3 API Project" (not archived)

**Steps:**
1. In "Q3 API Project", click "Create Task"
2. Fill in all fields:
   - Title: "Implement User Authentication"
   - Description: "Add JWT token support with refresh tokens"
   - Priority: "HIGH"
   - Due Date: 2026-05-15
   - Assign to: Any workspace member
   - Status: "TODO"
3. Click "Create Task"
4. Create 2 more tasks:
   - Task B: "Setup Database Schema" (HIGH, due 2026-05-01)
   - Task C: "Write API Tests" (MEDIUM, due 2026-05-20)
5. Open Task A, scroll to "Dependencies"
6. Click "Add Dependency"
7. Select Task B (this task depends on Task B completing first)
8. Verify dependency shows as "Blocked by: Setup Database Schema"

**Expected:**
- ✅ All task fields saved: title, description, priority, dueDate, assignee
- ✅ Dependencies can be added successfully
- ✅ Dependency relationship shows in both directions:
   - Task A shows "Blocked by: Task B"
   - Task B shows "Blocking: Task A"
- ✅ Task list shows dependency status

**Result:** [ ] PASS | [ ] FAIL

---

### ✅ **ITEM 10: Status transition enforces workflow rules**

**Setup:** Using tasks from ITEM 9

**Steps:**
1. Open Task A (Implement Auth) - status is "TODO", depends on Task B
2. Try to change status to "IN_REVIEW"
3. Should fail with error: "Cannot transition to IN_REVIEW: Task has 1 incomplete dependencies"
4. Open Task B (Setup Database)
5. Change status to "DONE" ✅
6. Go back to Task A
7. Now try to change Task A to "IN_REVIEW"
8. Should succeed ✅

**Expected:**
- ✅ Cannot move to IN_REVIEW/DONE if has incomplete blocking dependencies
- ✅ Error message is clear and helpful
- ✅ After dependency completes, transition is allowed
- ✅ Workflow rules prevent invalid states

**Result:** [ ] PASS | [ ] FAIL

---

### ✅ **ITEM 11: Circular dependency rejected**

**Setup:** Using tasks from ITEM 9

**Steps:**
1. Current state: Task A depends on Task B
2. Open Task B
3. Try to add dependency on Task A
4. Click "Add Dependency"
5. Try to select Task A
6. Should fail with error: "Adding this dependency would create a circular dependency"

**Also test multi-level cycle:**
1. Create Task D
2. Make Task C depend on Task D
3. Make Task D depend on Task B (which Task A depends on)
4. Current chain: A → B → D → C
5. Try to make Task A depend on Task C
6. Should fail: "would create circular dependency (A → B → D → C → A)"

**Expected:**
- ✅ Direct cycles rejected (A → B → A)
- ✅ Indirect cycles rejected (A → B → C → A)
- ✅ Deep cycles rejected (A → B → D → C → A)
- ✅ Clear error message explaining the cycle detected

**Result:** [ ] PASS | [ ] FAIL

---

### ✅ **ITEM 12: RBAC - VIEWER cannot create/edit/delete**

**Setup:** Create a VIEWER user

**Steps:**
1. In workspace, invite new user with VIEWER role:
   - Email: `viewer@example.com`
   - Role: "VIEWER"
2. In new incognito window, sign in as viewer@example.com
3. Navigate to same workspace
4. Verify you can:
   - ✅ View projects
   - ✅ View tasks
   - ✅ View comments
   - ✅ Read task details
5. Verify you CANNOT:
   - ❌ Create project (button disabled or rejected)
   - ❌ Create task (button disabled or rejected)
   - ❌ Edit task fields (fields readonly)
   - ❌ Delete task (delete button disabled)
   - ❌ Edit comments (edit button disabled)
   - ❌ Add reactions (reactions disabled)
   - ❌ Create/edit comments (form disabled)
   - ❌ Invite members (Members tab button disabled)
   - ❌ Edit workspace settings (Settings disabled)

**Expected:**
- ✅ VIEWER role has read-only access
- ✅ All create/update/delete actions blocked for VIEWER
- ✅ Buttons/forms disabled with visual indication (grayed out)
- ✅ If user tries via API/console, gets ForbiddenError
- ✅ Can verify in Members tab that user has "VIEWER" role

**Result:** [ ] PASS | [ ] FAIL

---

## 📊 COMPLETION TRACKING

| # | Feature | Status | Notes |
|----|---------|--------|-------|
| 1 | Sign up & auto-sign in | [ ] | |
| 2 | Sign in redirect | [ ] | |
| 3 | Sign out & session destroy | [ ] | |
| 4 | Create workspace (unique slug, OWNER role) | [ ] | |
| 5 | Invite member (role assigned, duplicate check) | [ ] | |
| 6 | Workspace switcher | [ ] | |
| 7 | Create project with dueDate & owner | [ ] | |
| 8 | Archive project (read-only) | [ ] | |
| 9 | Create task with all fields & dependencies | [ ] | |
| 10 | Status transition workflow rules | [ ] | |
| 11 | Circular dependency rejection | [ ] | |
| 12 | RBAC: VIEWER read-only | [ ] | |

**Progress: ___ / 12 ITEMS PASSING**

---

## 🔍 DEBUG TIPS

If something fails:

1. **Check browser console (F12 → Console)**
   - Look for JavaScript errors
   - Should show no red error messages

2. **Check Network tab (F12 → Network)**
   - Look at API requests (POST/GET/PUT/DELETE)
   - 200/201 = success, 400/403/404/500 = failure
   - Click request → Response tab to see error message

3. **Check Prisma Studio (http://localhost:5555)**
   - Verify data was actually saved to database
   - Check Project.dueDate has values (not NULL for ITEM 7)

4. **Check server logs**
   - Terminal should show any errors from Next.js/Prisma

5. **Database errors**
   - Most likely: Database not migrated
   - Solution: Already done with `prisma migrate dev`

---

## ✅ SUCCESS CRITERIA

**Pass all 12 tests** = Phase 8 & Beyond implementation is **COMPLETE** ✅

- [ ] **ALL 12 items passing** → Ready for production deployment
- [ ] **11/12 passing** → One bug to fix, identify which item failed
- [ ] **10 or fewer passing** → Multiple issues, review architecture

---

**Last Updated:** 2026-04-01 (After database migration fix)  
**Database:** ✅ Synced with schema (dueDate migration applied)  
**Server:** ✅ Running on port 3000
