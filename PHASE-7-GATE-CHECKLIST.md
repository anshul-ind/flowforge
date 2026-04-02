# Phase-7 Gate Checklist

**Status:** Ready to Start  
**Prerequisites:** Phase-6 ✅ (85% complete, ready to test)  
**Goal:** Full task lifecycle with approvals and dependencies

---

## 🔐 BACKEND GATE REQUIREMENTS

### Authentication & Authorization
- [ ] Sign up → unique email → auto sign-in → /workspace redirect
- [ ] Sign in → callbackUrl redirect working
- [ ] Sign out → session destroyed → /sign-in redirect
- [ ] User cannot access workspace they're not member of

### Workspace Management
- [ ] Create workspace → unique slug → creator set as OWNER
- [ ] Invite member → role saved → duplicate member check works
- [ ] Workspace switcher shows all user workspaces
- [ ] Cannot invite non-existent user (email validation)
- [ ] Cannot invite user twice (uniqueness check)

### Project Management
- [ ] Create project → all fields saved → owner auto-set
- [ ] Archive project → status = ARCHIVED → cannot edit archived
- [ ] Project list shows only projects in workspace
- [ ] Cannot create project in archived workspace
- [ ] Project deletion removes tasks (cascade)

### Task Management
- [ ] Create task with all fields saved (title, description, priority, status)
- [ ] Dependencies save correctly (parent/child relationships)
- [ ] Status transition rejects invalid moves (BACKLOG → DONE invalid)
- [ ] Circular dependency throws ValidationError (A→B→A)
- [ ] Cannot set task as self-dependency
- [ ] Task ownership enforces mutually-exclusive transitions

### Permission Enforcement
- [ ] VIEWER cannot create anything (tasks, comments, projects)
- [ ] VIEWER cannot edit anything
- [ ] VIEWER cannot delete anything
- [ ] VIEWER can only read (view tasks, comments, projects)
- [ ] EDITOR cannot change ownership or permissions
- [ ] OWNER can do everything
- [ ] TenantContext properly scopes all queries

---

## 🎨 UI GATE REQUIREMENTS

### Auth Pages
- [ ] Auth pages render correctly on mobile + desktop
- [ ] Password strength meter works in sign-up
- [ ] Error messages display for invalid inputs
- [ ] Loading state on submit button
- [ ] Redirect after sign-up works

### Navigation & Layout
- [ ] Sidebar collapses and state persists on reload
- [ ] Workspace switcher popover opens and navigates
- [ ] Active navigation link highlighted correctly
- [ ] Breadcrumb shows current location
- [ ] Mobile menu works on small screens

### Projects Page
- [ ] Projects page grid + list view toggle works (if implemented)
- [ ] Create project slide-over opens/closes/submits
- [ ] Validation errors display in form
- [ ] Success message shows after creation

### Task Views
- [ ] Task list page renders all tasks
- [ ] Task list shows priority/status badges correctly
- [ ] Task filtering by status works (if implemented)
- [ ] Task search works (if implemented)

### Task Creation/Detail
- [ ] Create task form opens and closes properly
- [ ] All fields validate on submission
- [ ] Dependencies visible in task detail
- [ ] Cannot create circular dependencies (UI validation)
- [ ] Task detail panel slides in/out smoothly

### Animation & Accessibility
- [ ] All animations respect prefers-reduced-motion
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Focus states visible on all buttons/inputs
- [ ] Color contrast passes WCAG AA
- [ ] Screen reader compatible (aria labels)

---

## ⚙️ GATE COMMANDS

### TypeScript & Linting
```bash
# Must pass with 0 errors
npx tsc --noEmit
npm run lint

# Expected output:
# ✓ tsc: 0 errors
# ✓ lint: 0 errors
```

### Build Verification
```bash
# Clean build must succeed
rm -rf .next
npm run build

# Expected output:
# ✓ Compiled successfully
# ✓ All routes generated successfully
```

### Runtime Verification
```bash
# Dev server must start
npm run dev

# Expected output:
# ✓ Ready on http://localhost:3000
# (No runtime console errors on navigation)
```

### Manual Testing
```bash
# 1. Navigate to all routes
# http://localhost:3000/sign-in
# http://localhost:3000/sign-up
# http://localhost:3000/workspace/[id]
# http://localhost:3000/workspace/[id]/projects
# http://localhost:3000/workspace/[id]/project/[id]

# 2. Open browser console (F12)
# Should see: NO hydration errors, NO TypeScript errors, NO 404s

# 3. Test auth flow
# Sign up → Should redirect to /workspace
# Sign in → Should redirect to callbackUrl
# Sign out → Should redirect to /sign-in

# 4. Test permissions
# Login as VIEWER → Cannot create/edit/delete
# Login as OWNER → Can do everything
```

---

## ✅ COMPLETION CRITERIA

**Phase-7 is COMPLETE when:**
1. ✅ All backend checks pass (auth, workspace, project, task, permissions)
2. ✅ All UI checks pass (pages, forms, animations, accessibility)
3. ✅ `npx tsc --noEmit` returns 0 errors
4. ✅ `npm run lint` returns 0 errors
5. ✅ Build succeeds without warnings
6. ✅ No runtime errors in browser console
7. ✅ Manual testing of auth flow passes
8. ✅ Permission enforcement verified (VIEWER/EDITOR/OWNER)

**Ready to move to:** Phase-8 (Comments, Reactions, Approvals)

---

## 📋 IMPLEMENTATION DEPENDENCIES

**Phase-7 requires from Phase-6:**
- ✅ Workspace layout and pages
- ✅ Project layout and pages
- ✅ Loading + error boundaries
- ✅ Navigation working
- ✅ Session auth working

**Phase-7 provides to Phase-8:**
- Task creation UI
- Task list/detail views
- All backend validations
- Permission system active

---

## 🚀 QUICK REFERENCE: What Gets Tested

| Component | Tests Required | Expected Result |
|-----------|---|---|
| **Auth Flow** | Sign up → auto login → /workspace | User logged in, session valid |
| **Workspace Mgmt** | Create workspace, invite member | Member added, unique check works |
| **Project Mgmt** | Create project, archive project | Project saved, archived status enforced |
| **Task Lifecycle** | Create → Move status → Delete | All transitions allowed/rejected correctly |
| **Dependencies** | Create A→B→A circular dep | ValidationError thrown |
| **Permissions** | VIEWER tries to create task | ForbiddenError thrown |
| **Hydration** | Navigate 5x routes | No "hydration mismatch" errors |
| **Build** | Run `npm run build` | Succeeds in <15s, 0 errors |

---

**Next Step:** After Phase-6 is 85% complete, proceed with Phase-7 implementation and gate testing.
