# Phase-8 Gate Checklist

**Status:** Implementation Complete (Ready for Testing & Debugging)  
**Date:** April 1, 2026  
**Prerequisites:** Phase-7 ✅  
**Goal:** Comments with Reactions, Mentions, and Approval Workflows

---

## 🎯 FEATURE IMPLEMENTATION GATE

### Comments System
- [ ] Comment creates and renders markdown correctly
- [ ] Comment body displays with syntax highlighting
- [ ] Comment author name and email shown
- [ ] Comment timestamp displays (created/edited)
- [ ] (edited) label shown when comment updated
- [ ] @mention highlighted in rendered comment (clickable/styled)
- [ ] Mention on comment shows user profile preview on hover

### Comment Reactions
- [ ] Reaction emoji picker opens on button click
- [ ] Emoji selection adds reaction to comment
- [ ] Reaction toggles off on second click (remove)
- [ ] Reaction count accurate (multiple users can use same emoji)
- [ ] Hover reaction shows list of users who reacted
- [ ] No duplicate reactions per user per emoji (unique constraint)
- [ ] Reactions persist after page refresh

### Comment Editing & Deletion
- [ ] Edit button only shows for comment author + manager + owner
- [ ] Edit form opens with current comment content
- [ ] Updated comment saves editedAt timestamp
- [ ] (edited) label appears after editing
- [ ] Delete button only shows for author + manager
- [ ] Deleted shows placeholder "This comment was deleted"
- [ ] Deleted comment cannot be edited
- [ ] Hard delete removes comment (or soft delete with placeholder)

### Comment Markdown
- [ ] Markdown **bold** renders correctly
- [ ] Markdown *italic* renders correctly
- [ ] Markdown `code` renders correctly
- [ ] Markdown # headers render correctly
- [ ] Markdown [link](url) renders as clickable link
- [ ] Markdown lists (- item, * item) render correctly
- [ ] XSS protection: raw HTML tags render as text, not executed
- [ ] Markdown preview tab shows rendering before submit

### Comment Mentions
- [ ] @username autocomplete appears when typing @
- [ ] Autocomplete shows only active workspace members
- [ ] Selected mention inserts @username into comment
- [ ] Multiple mentions in one comment allowed
- [ ] Mentioned user receives notification (if implemented)
- [ ] @mention links to user profile page
- [ ] @mention highlighted in rendered comment

### Optimistic Updates
- [ ] Comment appears instantly when submitted
- [ ] Temporary ID used until server confirms (`optimistic-${timestamp}`)
- [ ] "Sending..." indicator shows during save
- [ ] Comment replaces temp version when server responds
- [ ] Rollback on error: temp comment removed, user notified
- [ ] Form clears after successful submit
- [ ] Loading state prevents double-submit

---

## ✅ APPROVAL WORKFLOW BACKEND

### Approval Request Creation
- [ ] Approval submit → task status changes to IN_REVIEW
- [ ] Approval record created with: requester, approver, title, notes
- [ ] Cannot create duplicate approval (only one pending per task)
- [ ] Requester role validation enforced
- [ ] Approver must have MANAGER or OWNER role

### Approval Actions
- [ ] Approve → task status becomes DONE
- [ ] Reject without reason → validation error (reason required)
- [ ] Reject with reason → task goes to IN_PROGRESS + reason visible
- [ ] Cancel approval → task returns to BACKLOG
- [ ] Cannot approve own tasks (requester ≠ approver)

### Approval Notifications
- [ ] Reviewer receives notification when approval requested
- [ ] Reviewer notified of approval decision (approved/rejected)
- [ ] Requester notified of approval decision
- [ ] Notification includes task name and action taken

### Audit Trail
- [ ] Audit log records APPROVAL_SUBMITTED
- [ ] Audit log records APPROVAL_APPROVED
- [ ] Audit log records APPROVAL_REJECTED (with reason)
- [ ] Audit log records APPROVAL_CANCELLED
- [ ] Prisma $transaction pairs audit record with state change
- [ ] Rollback if audit fails (both or neither saved)

### Validation Rules
- [ ] Duplicate approval submit rejected (only one pending)
- [ ] Cannot approve twice (idempotent second attempt)
- [ ] Cannot reject then approve (one decision per approval)
- [ ] Cannot create approval for archived task
- [ ] Cannot create approval for DONE task

---

## 🎨 APPROVAL WORKFLOW UI

### Approval Button & Form
- [ ] Approval button appears on task detail
- [ ] Button disabled if user cannot request approval
- [ ] Approval form opens in modal/slide-over
- [ ] Form shows: approver selection, title, notes textarea
- [ ] Approver dropdown filtered to MANAGER/OWNER roles
- [ ] Submit button disabled if approver not selected
- [ ] Cancel button closes form without saving

### Approval Status Display
- [ ] Task status badge shows "In Review" when IN_REVIEW
- [ ] Approval details visible on task (who requested, when)
- [ ] Reviewer name prominently displayed
- [ ] Expected timeline/SLA shown (if available)

### Approval Decision UI
- [ ] Approve button launches decision form
- [ ] Reject button launches decision form with reason field
- [ ] Cancel button launches confirmation dialog
- [ ] Form submission shows loading state
- [ ] Success message shows decision made
- [ ] Task status updates live after decision
- [ ] Error message shows if decision fails

### Audit Log Display
- [ ] Audit log page shows all approval actions
- [ ] Filter by approval type (submitted/approved/rejected/cancelled)
- [ ] Show: timestamp, actor, action, task name
- [ ] Rejection reason visible in log
- [ ] Pagination works (10 items per page)
- [ ] Sort by date (oldest/newest first)

---

## 🔧 DEVELOPMENT CHECKLIST

### TypeScript & Build
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run lint` → 0 errors
- [ ] `npm run build` succeeds (no warnings during build)

### Database & Schema
- [ ] Comment, Mention, CommentReaction tables created
- [ ] Approval, AuditLog tables created
- [ ] All relationships defined in Prisma schema
- [ ] Migrations applied to database
- [ ] `npx prisma generate` succeeds

### Services & Repositories
- [ ] `CommentService` CRUD operations working
- [ ] `MentionService` add/remove operations working
- [ ] `ReactionService` toggle operations working
- [ ] `ApprovalService` workflow operations working
- [ ] `AuditLogService` recording all actions
- [ ] All services use TenantContext for isolation

### API Routes
- [ ] POST /api/tasks/[id]/comments → create comment
- [ ] PATCH /api/tasks/[id]/comments/[id] → edit comment
- [ ] DELETE /api/tasks/[id]/comments/[id] → delete comment
- [ ] POST /api/tasks/[id]/comments/[id]/reactions → add reaction
- [ ] DELETE /api/tasks/[id]/comments/[id]/reactions → remove reaction
- [ ] POST /api/tasks/[id]/approval → request approval
- [ ] POST /api/tasks/[id]/approval/approve → approve task
- [ ] POST /api/tasks/[id]/approval/reject → reject with reason
- [ ] GET /api/audit → fetch audit log (paginated)

---

## ✅ VERIFICATION COMMANDS

### Compile
```bash
npx tsc --noEmit
# Expected: 0 errors found in 1.23s
```

### Lint
```bash
npm run lint
# Expected: Done in 2.45s (0 errors)
```

### Build
```bash
npm run build
# Expected: ✓ Compiled successfully
#          ✓ Collected complete data
#          ✓ Generated 14 pages
```

### Runtime
```bash
npm run dev
# Expected: ✓ Ready on http://localhost:3000
#          (navigate to task, try comments/reactions/approval)
```

### Database (Optional)
```bash
npx prisma studio
# Expected: Opens http://localhost:5555
#          Check Comment, CommentReaction, Mention tables for data
```

---

## 🧪 MANUAL TEST FLOW

### Quick Test (5-10 minutes)
1. Start dev server: `npm run dev`
2. Navigate to task detail page
3. Add a test comment: "This is a test"
4. Click reaction button, add emoji
5. Edit comment: "This is an edited test"
6. Verify (edited) label shows
7. Open approval modal, select reviewer, submit
8. Verify task status changed to "In Review"
9. Approve task as reviewer
10. Verify task status changed to "Done"

### Full Test (1.5-2 hours)
**Comments:**
- Create comment, edit, delete (verify placeholder)
- Create comment with @mention (verify highlighting)
- Create comment with **bold** *italic* `code` (verify markdown)
- Click markdown preview tab (verify rendering)
- Add emoji reaction, toggle off (verify count)

**Mentions:**
- Type @ to open autocomplete
- Select member from list
- Verify mention highlighted in rendered
- Click mention to navigate to profile

**Reactions:**
- Add 👍 emoji to comment
- Add 👍 to same comment as different user (verify count = 2)
- Toggle off your 👍 (verify count = 1)
- Verify only your emoji toggles (others remain)

**Approvals:**
1. Create approval request
   - Select approver
   - Fill title and notes
   - Submit
   - Verify task status = IN_REVIEW

2. Approve task
   - Click Approve button
   - Verify task status = DONE
   - Verify audit log records action

3. Test rejection
   - Create another task
   - Request approval
   - Click Reject
   - Fill reason: "Needs more details"
   - Verify task status = IN_PROGRESS
   - Verify reason visible

4. Test cancel approval
   - Create approval
   - Click Cancel
   - Verify task status = BACKLOG
   - Verify audit log records it

**Audit Log:**
- Navigate to audit log page
- Filter by "approval"
- Sort by date
- Verify all approval actions recorded
- Verify pagination works

---

## ⚠️ EDGE CASES TO TEST

### Comment Validations
- [ ] Empty comment rejected
- [ ] Comment > 5000 chars rejected
- [ ] @unknown-user rejected at submit
- [ ] Multiple @mentions in one comment work
- [ ] Mention of self allowed

### Reaction Edge Cases
- [ ] Same user adds same emoji twice → just one reaction stored
- [ ] Add emoji 👍, remove, add again → allowed
- [ ] 10 users add same emoji → count = 10
- [ ] User reaction persists after refresh

### Approval Edge Cases
- [ ] Approver cannot be requester (validation)
- [ ] Cannot request approval twice (duplicate check)
- [ ] Cannot approve archived task
- [ ] Cannot approve DONE task
- [ ] Rejection reason required (cannot reject empty)
- [ ] Cancel approval button only shows if pending

### Circular Reference Check
- [ ] Comment A mentions B, B mentions A → allowed (not task deps)
- [ ] Create task A, Create task B (depends on A), Try A depends on B → error

---

## 📊 FINAL GATE DECISION MATRIX

| Item | Status | Priority | Blocker |
|------|--------|----------|---------|
| Comments CRUD | Must Pass | Critical | Yes |
| Reactions toggle | Must Pass | Critical | Yes |
| Mentions parsing | Must Pass | Critical | Yes |
| Edit with (edited) label | Must Pass | Critical | Yes |
| Approvals workflow | Must Pass | Critical | Yes |
| Audit logging | Must Pass | Critical | Yes |
| Markdown rendering | Should Pass | High | No |
| Optimistic updates | Should Pass | High | No |
| Notification emails | Should Pass | Medium | No |
| tsc/lint/build | Must Pass | Critical | Yes |

---

## ✅ GATE SIGN-OFF CHECKLIST

**Before marking Phase-8 as COMPLETE:**
- [ ] All comments features working (create/edit/delete/reactions)
- [ ] All mentions highlighted and functional
- [ ] All approvals workflow tested end-to-end
- [ ] Audit log recording every action
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run lint` → 0 errors
- [ ] `npm run build` succeeds
- [ ] Manual testing passed (quick + full flows)
- [ ] No runtime console errors
- [ ] Database verified with Prisma Studio

**Sign-off:** When all above checked, Phase-8 is PRODUCTION READY ✅

---

**Next:** Phase-9 (Analytics, Search, Performance)
