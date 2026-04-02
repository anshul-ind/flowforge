# TESTING GUIDE - PHASE-8 & BEYOND FEATURES

**Ready to test? Follow these steps!**

---

## 🚀 QUICK START (5 minutes)

### Step 1: Start Development Server
```bash
cd c:\flowforge\flowforge
npm run dev
```
Expected output: "ready - started server on 0.0.0.0:3000"

### Step 2: Open Browser
```
http://localhost:3000
```

### Step 3: Sign Up/Sign In
- Sign up if new: Create account with email & password
- Sign in with existing account
- ✅ Verify you're redirected to workspace after sign-in

---

## 🧪 TEST SCENARIOS

### TEST 1: Project Creation with Due Date
**Expected:** Create project and see dueDate field saved

```
1. Navigate to workspace → Projects
2. Click "Create Project" button
3. Fill in:
   - Name: "Q2 Product Release"
   - Description: "Major release with new features"
   - Due Date: 2026-06-30
4. Click "Create"
5. Verify project appears in list with due date
6. Open project detail and confirm due date is saved
```

**✅ If you see the due date in project details → PASS**

---

### TEST 2: Create Tasks with Proper Fields
**Expected:** Tasks created with all fields including dueDate and assignee

```
1. In project, create Task 1:
   - Title: "Backend API implementation"
   - Description: "Implement REST endpoints for projects"
   - Priority: HIGH
   - Due Date: 2026-06-15
   - Assign to: Select a workspace member

2. Create Task 2:
   - Title: "Frontend UI for projects"
   - Description: "Build React components for UI"
   - Priority: HIGH
   - Due Date: 2026-06-20
   - Assign to: Same member

3. Create Task 3:
   - Title: "Testing and QA"
   - Priority: MEDIUM
   - Assign to: Another member
```

**✅ If all tasks appear with assigned users → PASS**

---

### TEST 3: Task Dependencies - Basic
**Expected:** Can link Task 1 depends on Task 2

```
1. In project, open Task 1 (Frontend UI)
2. Scroll to "Dependencies" section
3. Click "Add Dependency"
4. Select Task 2 (Backend API) from list
5. Confirm: "Frontend depends on Backend API"
6. Click "Add Dependency"
```

**Expected Result:**
- Task 1 shows "Blocked by: Backend API"
- Task 2 shows "Blocking: Frontend UI"

**✅ If you see bidirectional dependency display → PASS**

---

### TEST 4: Task Dependencies - Circular Detection
**Expected:** Adding circular dependency throws error

```
Following from TEST 3 setup:
Task 1 → Task 2 (Task 1 depends on Task 2)

Now try to create cycle:
1. Open Task 2 (Backend API)
2. Click "Add Dependency"
3. Try to select Task 1 (Frontend UI)
4. This should fail with error:
   "Adding this dependency would create a circular dependency"
```

**❌ If you CAN add it: Bug - report this**  
**✅ If you get error message: PASS**

---

### TEST 5: Task Status Transitions with Dependencies
**Expected:** Status changes respect dependency rules

```
Setup from TEST 3:
Task 1 depends on Task 2

1. Try to mark Task 1 as "DONE":
   - Open Task 1
   - Change status to "DONE"
   - Should get error: "Cannot transition to DONE: Task has 1 incomplete dependencies"
   
2. Mark Task 2 as "DONE" first:
   - Open Task 2
   - Change status to "DONE" ✅
   
3. Now try Task 1 → "DONE":
   - Should succeed ✅ (dependency is complete)
```

**✅ If validation works correctly → PASS**

---

### TEST 6: Comments with Soft Delete
**Expected:** Deleted comments show placeholder, editedAt label appears

```
1. Open a task with comments
2. Add comment: "This is test comment"
3. Verify comment appears with "Sending..." then persists
4. Click edit button on comment
5. Change text to "This is edited comment"
6. Click save
7. Verify comment shows "(edited)" label
8. Click delete button
9. Verify comment shows "This comment was deleted"
10. Refresh page - verify deletion persists
```

**✅ If all behaviors work → PASS**

---

### TEST 7: Comment Reactions
**Expected:** Can react with emojis, see counts

```
1. In task, find a comment
2. Click emoji picker icon (😊)
3. Select emoji: 👍 (thumbs up)
4. Verify reaction appears with "1" count
5. Click emoji picker again
6. Select different emoji: ❤️ (heart)
7. Verify both reactions show together
8. Click 👍 again (toggle off)
9. Verify 👍 disappears, ❤️ remains
10. Refresh page - verify reactions persist
```

**✅ If reactions toggle correctly → PASS**

---

### TEST 8: Comment Mentions
**Expected:** @mentions autocomplete and display

```
1. In task, open comment form
2. Type: "Hey @" (should show autocomplete)
3. Click on a workspace member
4. Verify text shows "@username"
5. Add more text: "could you review this?"
6. Submit comment
7. Verify comment displays:
   - User gets notified
   - Mention appears as blue badge
8. Refresh page - verify mentions persist
```

**✅ If @mentions work with autocomplete → PASS**

---

## 🔍 DATABASE VERIFICATION

### Check Prisma Studio
```bash
# In another terminal:
npx prisma studio

# Then open http://localhost:5555
```

**Verify these tables have data:**
- ✅ Project table: Projects with dueDate values
- ✅ Task table: Tasks with proper assignments
- ✅ TaskDependency: Links between tasks
- ✅ Comment: Comments with editedAt/deletedAt fields
- ✅ CommentReaction: Emoji reactions with counts
- ✅ Mention: @mentions linked to comments

---

## 📊 PERFORMANCE CHECKS

### Expected Response Times
- Create project: < 500ms
- Create task: < 500ms
- Add dependency: < 300ms (with circular check)
- Get dependencies: < 200ms
- Add reaction: < 200ms
- Submit comment: < 500ms

### Check in Browser DevTools
1. Open DevTools (F12)
2. Go to Network tab
3. Perform actions (create, edit, delete)
4. Verify response times in "Time" column

**⏱️ Most operations should be < 500ms**

---

## ✅ COMPLETION CHECKLIST

Mark each test as you complete it:

- [ ] **TEST 1:** Project creation with due date
- [ ] **TEST 2:** Tasks with all fields
- [ ] **TEST 3:** Task dependencies visualization
- [ ] **TEST 4:** Circular dependency rejection
- [ ] **TEST 5:** Status transition validation
- [ ] **TEST 6:** Comment soft delete & edit label
- [ ] **TEST 7:** Comment emoji reactions
- [ ] **TEST 8:** Comment @mentions
- [ ] **DATABASE:** Prisma Studio shows correct data
- [ ] **PERFORMANCE:** Operations complete in < 500ms

---

## 🐛 BUG REPORTING

If you find an issue, note:

1. **Test Number:** Which test failed?
2. **Action:** What did you do?
3. **Expected:** What should happen?
4. **Actual:** What actually happened?
5. **Error Message:** Any error shown? (F12 Console)

### Example Bug Report
```
TEST 3 - Task Dependencies - FAIL
Action: Tried to add Task 1 depends on Task 2
Expected: Dependency created successfully
Actual: Got error "Task not found"
Error: "Error: Task not found in workspace"
```

---

## 🎯 SUCCESS CRITERIA

**All 8 tests PASS** = Implementation is complete and working correctly ✅

**TypeScript Errors**: 0 (verified with `npx tsc --noEmit`)

**All Features Working**:
- ✅ Project due dates
- ✅ Task dependencies with circular detection
- ✅ Status transition workflow rules
- ✅ Comment soft delete with edit labels
- ✅ Emoji reactions
- ✅ @mentions with autocomplete
- ✅ Zero TypeScript compilation errors

---

## 📝 NOTES

- Always test with Chrome/Firefox (modern browsers)
- Use Incognito/Private mode if you get cache issues
- Check browser console (F12) for any JavaScript errors
- Database data persists after page refresh
- All operations are tenant-scoped (workspace-isolated)

---

**Happy Testing! 🚀**

For questions or issues, check IMPLEMENTATION-COMPLETE.md for architecture details.
