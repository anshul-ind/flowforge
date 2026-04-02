# Phase 7 Gate Manual Verification Checklist

**Purpose:** Quick manual testing script to verify all Phase 7 gate requirements work end-to-end.

**Time Required:** ~15 minutes (full verification)  
**Test Environment:** `npm run dev` on localhost:3000

---

## 🚀 Quick Start Testing

### 1. Start Development Server
```bash
# Clear build cache
rm -rf .next

# Start dev server
npm run dev

# Expected output:
# ✓ Ready in 2.5s
# ✓ Ready at http://localhost:3000
```
**Verification:** ⬜ Pass / ⬜ Fail

---

## 🔐 Authentication Tests (8 items)

### Test 1.1: Sign-Up with Valid Email
**Steps:**
1. Navigate to `http://localhost:3000/sign-up`
2. Fill form:
   - Email: `testuser@example.com`
   - Password: `TestPass123`
   - Confirm: `TestPass123`
3. Click "Sign Up"

**Expected:** Auto sign-in → redirected to `/workspace`

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 1.2: Sign-Up with Duplicate Email
**Steps:**
1. Try signing up with email from Test 1.1 again
2. Fill same form data

**Expected:** Error message: "Email already exists"

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 1.3: Sign-Up with Weak Password
**Steps:**
1. Navigate to sign-up
2. Try password: `weak`
3. Check password strength meter

**Expected:**
- Strength meter shows "Weak" (red)
- Submit button disabled
- Error: "Password must be at least 8 characters with uppercase, lowercase, and number"

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 1.4: Sign-Out Session Destruction
**Steps:**
1. Sign in with credentials from Test 1.1
2. Click user menu → "Sign Out"
3. Try accessing `/workspace`

**Expected:** Redirected to `/sign-in`, session destroyed

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 1.5: Sign-In with Valid Credentials
**Steps:**
1. Navigate to `/sign-in`
2. Email: `testuser@example.com`
3. Password: `TestPass123`
4. Click "Sign In"

**Expected:** Session created → redirected to `/workspace`

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 1.6: Sign-In with Wrong Password
**Steps:**
1. Try signing in with correct email, wrong password

**Expected:** Error message: "Invalid credentials" (generic, no email hint)

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 1.7: Sign-In with Non-existent Email
**Steps:**
1. Try signing in with: `nonexistent@test.com`

**Expected:** Error message: "Invalid credentials"

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 1.8: Redirect After Auth
**Steps:**
1. Sign in to `/sign-in?callbackUrl=/workspace/123/projects`
2. Verify redirect destination

**Expected:** After sign-in, redirected to `/workspace/123/projects`

**Verification:** ⬜ Pass / ⬜ Fail

---

## 🏢 Workspace Management (6 items)

### Test 2.1: Create Workspace with Unique Slug
**Steps:**
1. At `/workspace`, click "Create Workspace"
2. Enter name: `My Test Workspace`
3. Submit form

**Expected:**
- Workspace created
- Slug auto-generated: `my-test-workspace`
- Creator = OWNER role
- Redirected to workspace dashboard

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 2.2: Create Duplicate Workspace Name
**Steps:**
1. Create another workspace with same name as Test 2.1
2. Verify slug handling

**Expected:**
- Second workspace created
- Different slug: `my-test-workspace-2` or similar
- No error

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 2.3: Access Workspace Switcher
**Steps:**
1. At workspace dashboard, look at top-left
2. Click workspace switcher dropdown

**Expected:**
- Shows all user's workspaces
- Shows current workspace (highlighted)
- Can click to navigate

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 2.4: Invite Member by Email
**Steps:**
1. In workspace settings (if available) or members panel
2. Click "Invite Member"
3. Enter email: `newmember@example.com`
4. Role: MEMBER
5. Submit

**Expected:**
- Member added to workspace
- Role saved as MEMBER
- Duplicate check prevents re-inviting same email

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 2.5: Invite Duplicate Member
**Steps:**
1. Try inviting same email from Test 2.4 again

**Expected:** Error: "User already member of workspace"

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 2.6: Edit Member Role
**Steps:**
1. Find invited member in workspace members list
2. Change role from MEMBER → MANAGER

**Expected:**
- Role updated
- Member permissions change immediately

**Verification:** ⬜ Pass / ⬜ Fail

---

## 📁 Project Management (5 items)

### Test 3.1: Create Project with All Fields
**Steps:**
1. In workspace, click "Create Project"
2. Fill:
   - Name: `My Project`
   - Description: `Test project description`
   - Due Date: Pick a future date
3. Submit

**Expected:**
- Project created with all fields saved
- Creator = OWNER
- Visible in projects list

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 3.2: Create Second Project in Same Workspace
**Steps:**
1. Create another project in same workspace
2. Verify both appear in project list

**Expected:** Both projects visible in grid

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 3.3: Archive Project
**Steps:**
1. Open a project
2. Go to settings/options
3. Click "Archive"

**Expected:**
- Project status = ARCHIVED
- Cannot create/edit tasks in archived project
- Still visible in list (with "Archived" badge)

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 3.4: Try Editing Archived Project
**Steps:**
1. Try to update archived project name
2. Try to create task in archived project

**Expected:** Error: "Cannot modify archived project"

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 3.5: Project List Shows Only Current Workspace
**Steps:**
1. Create project in Workspace A → named "Project A"
2. Create project in Workspace B → named "Project B"
3. Switch to Workspace A projects page

**Expected:** Only shows "Project A", not "Project B"

**Verification:** ⬜ Pass / ⬜ Fail

---

## ✅ Task Management (8 items)

### Test 4.1: Create Task with All Fields
**Steps:**
1. In project, click "Create Task"
2. Fill:
   - Title: `Test Task`
   - Description: `Task description`
   - Priority: HIGH
   - Status: TODO
   - Due Date: Pick date
   - Assignee: Pick workspace member
3. Submit

**Expected:**
- Task created with all fields saved
- Appears in task list
- Shows in correct status column

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 4.2: Update Task Status
**Steps:**
1. Create task (from Test 4.1)
2. Drag to IN_PROGRESS column OR click and change status
3. Verify update

**Expected:**
- Status changed in database
- Updates immediately in UI

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 4.3: Invalid Status Transition
**Steps:**
1. Try invalid transition: BACKLOG → DONE (skip IN_PROGRESS)
2. OR try transition from DONE → BACKLOG

**Expected:** Error: "Invalid status transition"

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 4.4: Add Task Dependency
**Steps:**
1. Create Task A and Task B
2. On Task B detail, click "Add Dependency"
3. Select Task A as dependency

**Expected:**
- Dependency saved
- Task B cannot be marked DONE until Task A is ready
- Displayed in task detail

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 4.5: Circular Dependency Detection
**Steps:**
1. Create Task A → Task B (A depends on B)
2. Try to make B depend on A

**Expected:** Error: "Circular dependency detected"

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 4.6: Self-Dependency Prevention
**Steps:**
1. On a task, try to add itself as dependency

**Expected:** Error: "Task cannot depend on itself"

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 4.7: Multiple Dependencies
**Steps:**
1. Create Task A, B, C, D
2. Make D depend on both A and B
3. Edit A or B status

**Expected:**
- All 4 tasks relate correctly
- D shows 2 dependencies
- No circular issues

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 4.8: Task Created in Correct Workspace/Project
**Steps:**
1. Create task in Workspace A, Project X
2. Switch to Workspace B, Project Y
3. Check project tasks

**Expected:** Task from X not visible in Y

**Verification:** ⬜ Pass / ⬜ Fail

---

## 🔒 Permission Tests (4 items)

### Test 5.1: VIEWER Cannot Create Tasks
**Steps:**
1. Create new user with VIEWER role
2. Log in as VIEWER
3. Try to create task

**Expected:** Button disabled or error: "Permission denied"

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 5.2: VIEWER Cannot Edit Tasks
**Steps:**
1. As VIEWER, click on existing task
2. Try to change title/status

**Expected:** Fields disabled or error: "Read-only access"

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 5.3: MEMBER Can Create/Edit Own Tasks
**Steps:**
1. Create user with MEMBER role
2. Create task as MEMBER
3. Edit it

**Expected:** Can create and edit own tasks

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 5.4: OWNER Full Control
**Steps:**
1. As OWNER, verify can:
   - Create tasks
   - Edit all tasks (not just own)
   - Archive project
   - Invite members
   - Change roles
   - Delete tasks

**Expected:** All operations allowed

**Verification:** ⬜ Pass / ⬜ Fail

---

## 🎨 UI/UX Tests (6 items)

### Test 6.1: Responsive Auth Pages
**Steps:**
1. Open `/sign-up` on
   - Desktop (1920px)
   - Tablet (768px)
   - Mobile (375px)
2. Test form usability

**Expected:** Forms layout properly on all sizes, no overflow

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 6.2: Sidebar Collapse State Persists
**Steps:**
1. Toggle sidebar collapse
2. Reload page (F5)
3. Check if state persists

**Expected:** Sidebar state (open/collapsed) remains after reload

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 6.3: Password Strength Meter
**Steps:**
1. On sign-up, type passwords:
   - `weak` (show as Weak)
   - `Better1` (show as Good)
   - `SecurePass123!@#` (show as Strong)

**Expected:** Meter updates in real-time with proper colors

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 6.4: Error Messages Display
**Steps:**
1. Try signing up with:
   - Invalid email: `notanemail`
   - Short password: `ab1`
   - Password mismatch

**Expected:** Each field shows specific error message inline

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 6.5: Loading States
**Steps:**
1. Fill sign-up form
2. Click submit
3. Observe button during submission

**Expected:** Button shows loading spinner, text changes to "Signing up..."

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 6.6: Keyboard Navigation
**Steps:**
1. Open any form (sign-up, create task, etc.)
2. Navigate using Tab key only
3. Verify focus order is logical
4. Try submitting with Enter key

**Expected:** All interactive elements reachable via Tab, forms submit with Enter

**Verification:** ⬜ Pass / ⬜ Fail

---

## ⚙️ Technical Verification (3 items)

### Test 7.1: TypeScript Type Checking
**Steps:**
```bash
npx tsc --noEmit
```

**Expected:** 0 errors

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 7.2: Build Verification
**Steps:**
```bash
npm run build
```

**Expected:**
- ✓ Compiled successfully
- No errors in output
- Build time < 30 seconds

**Verification:** ⬜ Pass / ⬜ Fail

---

### Test 7.3: Dev Server No Console Errors
**Steps:**
1. Run `npm run dev`
2. Test each route while watching browser console
3. Check for red errors (warnings OK)

**Expected:** No red error messages in console

**Verification:** ⬜ Pass / ⬜ Fail

---

## 📊 Summary

| Category | Tests | Passed | Failed |
|----------|-------|--------|--------|
| **Authentication** | 8 | ⬜ | ⬜ |
| **Workspace Mgmt** | 6 | ⬜ | ⬜ |
| **Project Mgmt** | 5 | ⬜ | ⬜ |
| **Task Mgmt** | 8 | ⬜ | ⬜ |
| **Permissions** | 4 | ⬜ | ⬜ |
| **UI/UX** | 6 | ⬜ | ⬜ |
| **Technical** | 3 | ⬜ | ⬜ |
| **TOTAL** | **40** | ⬜ | ⬜ |

---

## 🎯 Gate Decision Criteria

✅ **PASS IF:**
- All 40 tests: PASS
- 0 TypeScript errors
- Build completes successfully
- No console errors

🟡 **CONDITIONAL IF:**
- 35+ tests pass (minor UI issues)
- All critical tests pass (auth, workspace, task, permissions)

❌ **FAIL IF:**
- Any critical test fails
- TypeScript errors exceed 5
- Build fails
- Permission tests fail

---

## 📝 Notes

- Tests can be run in any order
- Each test is independent
- Use `npm run dev` for all manual tests
- For API testing, use browser DevTools Network tab
- Check localStorage for sidebar state persistence

---

**Testing Recommendations:**

1. **Quick Path (5 min):** Tests 1.1, 2.1, 3.1, 4.1, 5.4, 7.1, 7.2
2. **Standard Path (10 min):** All tests except 6.x
3. **Full Verification (15 min):** All 40 tests

---

**Date Completed:** _________________  
**Tester Name:** _________________  
**Result:** ⬜ PASS / ⬜ FAIL

