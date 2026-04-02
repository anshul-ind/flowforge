# PHASE 8 IMPLEMENTATION - TASK BREAKDOWN

## Overview
Phase 8 has **21 files already created** (90% complete). This document breaks down remaining work into clean, testable tasks.

---

## TASK GROUP 1: COMMENTS SYSTEM TESTING

### Task 1.1: Test Basic Comment Creation
**Objective:** Verify comments create and display correctly
**Time:** 10 minutes
**Steps:**
1. Start dev server: `npm run dev`
2. Sign in → navigate to a task
3. Scroll to comments section
4. Enter comment text: "Test comment with **bold** and *italic*"
5. Click "Post Comment"
**Verify:**
- Comment appears immediately (optimistic update)
- Markdown renders (bold text visible)
- Timestamp shows correct
- User name shows correct
- "Edited" label NOT showing (not edited)

**Success Criteria:**
- ✅ Comment visible in list
- ✅ Markdown formatting works
- ✅ User attribution correct

---

### Task 1.2: Test Markdown Preview
**Objective:** Verify markdown preview tab works
**Time:** 5 minutes
**Steps:**
1. Click comment form
2. Type: "# Heading\n\nParagraph with [link](https://example.com)"
3. Click "Preview" tab
4. Verify formatting renders correctly
5. Click "Write" tab
6. Verify markdown source shows

**Verify:**
- Preview shows rendered HTML
- Links are clickable
- Headers display correctly
- Write tab shows raw markdown

**Success Criteria:**
- ✅ Both tabs toggle correctly
- ✅ Preview renders markdown accurately

---

### Task 1.3: Test Comment Edit
**Objective:** Verify editing updates comment and shows "(edited)" label
**Time:** 10 minutes
**Steps:**
1. Post a comment: "Original text"
2. Click three-dot menu on comment
3. Click "Edit"
4. Change to: "Updated text"
5. Click "Save"
6. Wait for update to complete

**Verify:**
- Comment text changes to "Updated text"
- "(edited)" label appears below timestamp
- editedAt shows recent time

**Success Criteria:**
- ✅ Comment updates correctly
- ✅ "(edited)" label visible
- ✅ Timestamp reflects edit time

---

### Task 1.4: Test Comment Delete
**Objective:** Verify soft delete works and shows placeholder
**Time:** 10 minutes
**Steps:**
1. Post a comment: "Delete me"
2. Click three-dot menu
3. Click "Delete"
4. Confirm deletion
5. Refresh page (hard refresh F5)

**Verify:**
- Comment body disappears before refresh
- After refresh: placeholder shows "[Deleted comment]"
- Metadata (author, date) still shows
- User can't see original text

**Success Criteria:**
- ✅ Placeholder shows correctly
- ✅ Content is not visible
- ✅ Metadata preserved

---

### Task 1.5: Test Reactions - Add
**Objective:** Verify adding emoji reactions works
**Time:** 5 minutes
**Steps:**
1. Post a comment
2. Hover over comment → see reaction button
3. Click reaction button (emoji icon)
4. Select emoji: "👍" (thumbs up)
5. Verify reaction appears under comment

**Verify:**
- Reaction button shows 👍
- Count shows "1"
- Your name in hover tooltip

**Success Criteria:**
- ✅ Reaction added to comment
- ✅ Count accurate

---

### Task 1.6: Test Reactions - Toggle Remove
**Objective:** Verify removing reaction decrements count
**Time:** 5 minutes
**Steps:**
1. On comment with 👍 reaction you added
2. Click the 👍 reaction badge
3. Verify reaction disappears
4. Click again to re-add

**Verify:**
- Clicking removes reaction
- Click again adds it back
- Count updates correctly

**Success Criteria:**
- ✅ Toggle add/remove works
- ✅ Count updates accurately

---

### Task 1.7: Test @Mentions
**Objective:** Verify mention parsing and display
**Time:** 15 minutes
**Steps:**
1. Start typing comment with "@"
2. See dropdown with workspace members
3. Type "@alice" (pick a real user)
4. Click or press Enter to insert
5. Verify "@alice" shows selected
6. Submit comment
7. Check comment displays with mention highlighted

**Verify:**
- Dropdown shows matching users
- Mention inserts correctly
- Comment renders with mention highlighted
- Mentioned user can be identified

**Success Criteria:**
- ✅ Mention autocomplete works
- ✅ Mention displays highlighted
- ✅ Mention saves correctly

---

### Task 1.8: Test Optimistic Updates
**Objective:** Verify comments appear instantly before server responds
**Time:** 10 minutes
**Steps:**
1. Open Network tab in DevTools
2. Throttle to "Slow 3G"
3. Type and submit comment
4. Verify comment appears IMMEDIATELY (before network request completes)
5. Wait for request to complete
6. Refresh page
7. Verify comment still there

**Verify:**
- Comment appears instantly despite slow network
- Request takes 10+ seconds to complete
- Comment persists after refresh

**Success Criteria:**
- ✅ Optimistic update works
- ✅ Comment saved correctly

---

## TASK GROUP 2: APPROVAL WORKFLOW TESTING

### Task 2.1: Test Approval Request Creation
**Objective:** Verify task can be submitted for approval
**Time:** 10 minutes
**Steps:**
1. Create or find a task in IN_PROGRESS status
2. Click "Request Approval" (or similar button)
3. Select reviewer: OWNER
4. Click "Submit for Review"
5. Wait for confirmation

**Verify:**
- Task status changes to IN_REVIEW
- Approval request created in database
- In /workspace/{id}/approvals page, approval appears in "Pending" tab

**Success Criteria:**
- ✅ Task moves to IN_REVIEW
- ✅ Approval visible in approvals page
- ✅ Correct reviewer selected

---

### Task 2.2: Test Approval Idempotency
**Objective:** Verify re-submitting doesn't create duplicate approval
**Time:** 10 minutes
**Steps:**
1. From Task 2.1: task already in IN_REVIEW with pending approval
2. Click "Request Approval" again
3. Select OWNER again
4. Click "Submit for Review"
5. Check if error message: "Already pending approval" or similar
6. Check database or Approvals page for duplicate records

**Verify:**
- Either get error message OR
- Approval count stays 1 (not 2)
- Same approval record returned

**Success Criteria:**
- ✅ No duplicate approval created
- ✅ Appropriate error/response shown to user

---

### Task 2.3: Test Approve (Reviewer Perspective)
**Objective:** Verify OWNER can approve task
**Time:** 15 minutes
**Setup:** 
- Need 2 accounts: MEMBER (submitter) + OWNER (reviewer)
- Task pending approval from Task 2.1
**Steps:**
1. Sign out → Sign in as OWNER account
2. Navigate to workspace
3. Go to /approvals page
4. See task in "Pending" tab (tasks awaiting your review)
5. Click "Approve" button
6. Wait for confirmation
7. Sign back in as MEMBER

**Verify (MEMBER perspective after switching back):**
- Task status changed to DONE
- Approval badge removed
- Comment visible: "{OWNER} approved this task"
- Approval record shows APPROVED status

**Success Criteria:**
- ✅ Task moves from IN_REVIEW → DONE
- ✅ Approval status: APPROVED
- ✅ Audit log shows approval action

---

### Task 2.4: Test Reject with Reason
**Objective:** Verify rejection with required reason and task status change
**Time:** 15 minutes
**Setup:** Create another task for approval
**Steps:**
1. From reviewer (_OWNER_) account
2. Go to /approvals page
3. Find pending approval
4. Click "Reject" button
5. Try to submit WITHOUT reason → should error
6. Enter reason: "Needs better implementation" (10+ chars)
7. Click "Submit Rejection"
8. Wait for confirmation
9. Switch to MEMBER account
10. View the rejected task

**Verify (Task Detail):**
- Task status: IN_PROGRESS
- Rejection reason visible: "Needs better implementation"
- Comment shows rejection reason
- Approval record shows REJECTED status

**Success Criteria:**
- ✅ Validation prevents empty/short reason
- ✅ Task moves back to IN_PROGRESS
- ✅ Reason is visible to submitter
- ✅ Audit log recorded REJECTED action

---

### Task 2.5: Test Cancel Approval
**Objective:** Verify submitter can cancel pending approval
**Time:** 10 minutes
**Setup:** Create approval pending review
**Steps:**
1. From MEMBER account with pending approval
2. View task
3. Click "Cancel Approval Request"
4. Confirm cancellation
5. Check approvals page

**Verify:**
- Task status: BACKLOG or back to original status
- Approval status: CANCELLED
- Approval disappears from approvals page

**Success Criteria:**
- ✅ Approval cancelled
- ✅ Task status reset
- ✅ Audit log shows CANCELLED action

---

### Task 2.6: Test Approvals Page Filtering
**Objective:** Verify approvals page filters work
**Time:** 10 minutes
**Setup:** Multiple approvals in different states
**Steps:**
1. Navigate to /workspace/{id}/approvals
2. Click "Pending" tab → shows only PENDING approvals
3. Click "Sent" tab → shows only your submitted approvals
4. Click "All" tab → shows all approvals
5. Click on an approval to view details

**Verify:**
- Tabs filter correctly
- Correct approvals shown in each tab
- Count matches expected

**Success Criteria:**
- ✅ Filtering works for Pending/Sent/All
- ✅ Data displayed accurately

---

## TASK GROUP 3: AUDIT LOGGING TESTING

### Task 3.1: Verify Audit Log Creation
**Objective:** Verify actions are logged in audit log
**Time:** 10 minutes
**Steps:**
1. Navigate to /workspace/{id}/audit page
2. Create a comment (trigger COMMENT_CREATED action)
3. Refresh audit page
4. Scroll to recent entries
5. Find the COMMENT_CREATED entry

**Verify:**
- New entry shows in audit log
- Action type: COMMENT_CREATED
- Actor: your name
- Entity: Comment
- Timestamp: recent

**Success Criteria:**
- ✅ Audit log entry created
- ✅ All fields populated correctly

---

### Task 3.2: Verify Audit Log for Major Actions
**Objective:** Verify approval and project actions are logged
**Time:** 20 minutes
**Steps:**
1. In /audit page
2. Create a project → check for PROJECT_CREATED in audit log
3. Create a task → check for TASK_CREATED
4. Submit approval → check for APPROVAL_SUBMITTED
5. Approve task → check for APPROVAL_APPROVED

**Verify:**
- Each action creates audit log entry
- Action names match expected enum values
- Metadata shows before/after states (if applicable)
- Timestamps are sequential

**Success Criteria:**
- ✅ All major actions logged
- ✅ Audit trail is complete

---

### Task 3.3: Test Audit Log Pagination
**Objective:** Verify pagination works with many records
**Time:** 10 minutes
**Setup:** Have 50+ audit log entries
**Steps:**
1. Navigate to /workspace/{id}/audit
2. See first 50 entries
3. Click "Next Page" or scroll to end
4. See next page of entries

**Verify:**
- Shows 50 records per page
- Navigation works
- Page numbers correct
- No duplicate records between pages

**Success Criteria:**
- ✅ Pagination works
- ✅ All records visible across pages

---

### Task 3.4: Test Audit Filtering
**Objective:** Verify filtering by entity type and date range
**Time:** 10 minutes
**Steps:**
1. On /audit page
2. Filter by Entity Type: "Comment" → should show only COMMENT_* actions
3. Filter by Entity Type: "Task" → should show only TASK_* actions
4. Filter by Date Range: "Last 7 days" → should show recent entries only
5. Clear filters → should show all again

**Verify:**
- Filters work correctly
- Records displayed match filter criteria
- Counts update

**Success Criteria:**
- ✅ Entity type filter works
- ✅ Date range filter works
- ✅ Multiple filters work together

---

## TASK GROUP 4: CODE QUALITY VERIFICATION

### Task 4.1: TypeScript Type Check
**Objective:** Ensure 0 TypeScript errors
**Time:** 5 minutes
**Command:**
```bash
npx tsc --noEmit
```

**Expected Output:**
```
(no output = success)
```

**Verify:**
- No errors reported
- No warnings about null safety

**Success Criteria:**
- ✅ 0 errors
- ✅ 0 warnings

---

### Task 4.2: ESLint Linting
**Objective:** Ensure code follows lint rules
**Time:** 5 minutes
**Command:**
```bash
npm run lint
```

**Expected Output:**
```
✓ No errors
```

**Verify:**
- No errors reported

**Success Criteria:**
- ✅ Linting passes

---

### Task 4.3: Production Build
**Objective:** Verify production build succeeds
**Time:** 15 minutes
**Command:**
```bash
npm run build
```

**Expected Output:**
```
✓ Compiled successfully
✓ Finished TypeScript
... (routes listed)
```

**Verify:**
- Build completes without errors
- All routes listed at end
- No TypeScript errors during build

**Success Criteria:**
- ✅ Build succeeds
- ✅ 0 errors

---

## SUMMARY TABLE

| Task | Time | Status |
|------|------|--------|
| **Task 1.1** - Comment Create | 10 min | Pending |
| **Task 1.2** - Markdown Preview | 5 min | Pending |
| **Task 1.3** - Comment Edit | 10 min | Pending |
| **Task 1.4** - Comment Delete | 10 min | Pending |
| **Task 1.5** - Add Reaction | 5 min | Pending |
| **Task 1.6** - Remove Reaction | 5 min | Pending |
| **Task 1.7** - Mentions | 15 min | Pending |
| **Task 1.8** - Optimistic Update | 10 min | Pending |
| **Task 2.1** - Create Approval | 10 min | Pending |
| **Task 2.2** - Idempotency | 10 min | Pending |
| **Task 2.3** - Approve | 15 min | Pending |
| **Task 2.4** - Reject | 15 min | Pending |
| **Task 2.5** - Cancel | 10 min | Pending |
| **Task 2.6** - Filtering | 10 min | Pending |
| **Task 3.1** - Audit Creation | 10 min | Pending |
| **Task 3.2** - Audit Actions | 20 min | Pending |
| **Task 3.3** - Pagination | 10 min | Pending |
| **Task 3.4** - Filtering | 10 min | Pending |
| **Task 4.1** - TypeScript | 5 min | Pending |
| **Task 4.2** - ESLint | 5 min | Pending |
| **Task 4.3** - Build | 15 min | Pending |

**Total Time:** ~3.5 hours for all tasks

---

## EXECUTION PLAN

### Phase 8 Gate Preparation (Recommended Order)

**Day 1 (2 hours):**
- Tasks 1.1 - 1.8 (Comments testing)
- Tasks 4.1 - 4.3 (Code quality)

**Day 2 (1.5 hours):**
- Tasks 2.1 - 2.6 (Approval testing)

**Day 3 (1 hour):**
- Tasks 3.1 - 3.4 (Audit testing)

**Result:** All Phase 8 gate requirements verified ✅

---

## NOTES

- Each task is independent (can be done in any order)
- Estimated times assume developer familiarity with Next.js
- If tests fail, document the issue and we'll fix
- Update this doc as you complete tasks
