# Future Work: Phase-6+ Implementation Roadmap

## Overview

Phase-5 completed all foundational patterns. Phase-6+ will implement features using these patterns. This document tracks what remains.

---

## Phase-6: Core Features (Required for MVP)

### Feature 1: Workspace Management

#### 1.1 Create Workspace
**Status:** ❌ Not started
**Dependencies:** Phase-5 patterns ✅
**Effort:** 2-3 days
**Tasks:**
- [ ] Create workspace form component
- [ ] Implement `modules/workspace/create-action.ts`
- [ ] Workspace creation initial member setup
- [ ] Workspace slug generation and uniqueness check
- [ ] Redirect to workspace dashboard after creation

**Technical Details:**
```typescript
// Expected implementation
modules/workspace/
├── schemas.ts         // ✅ createWorkspaceSchema - name (3-50 chars), slug
├── policies.ts        // ✅ PUBLIC - anyone can create workspace
├── repository.ts      // ❌ Implement findBySlug, create, findMany  
├── service.ts         // ❌ Implement createWorkspace with auto-membership
└── create-action.ts   // ❌ Server action: form → validation → service
```

**Database Changes:** None (schema already supports)

#### 1.2 Invite Members
**Status:** ❌ Not started
**Dependencies:** Workspace creation ✅
**Effort:** 3-4 days
**Tasks:**
- [ ] Implement member invitation form
- [ ] Create `modules/workspace/invite-action.ts`
- [ ] Send invitation emails (future: Phase-7)
- [ ] Implement invitation acceptance link
- [ ] Role assignment during invitation
- [ ] Rate limiting on invitations (prevent spam)

**Technical Details:**
```typescript
// Will need new model: WorkspaceInvitation
// OR use automatic join with shareable link

// Flow:
// 1. Owner/Manager invites user by email
// 2. System creates WorkspaceMember with MEMBER role
// 3. Send notification to invited user
// 4. User accepts and joins workspace
```

#### 1.3 Member Management
**Status:** ❌ Not started
**Dependencies:** Invite members ✅
**Effort:** 2-3 days
**Tasks:**
- [ ] List workspace members
- [ ] Change member roles (Owner/Manager/Member/Viewer)
- [ ] Remove members
- [ ] Display member join date and last activity
- [ ] Member settings page

**Technical Details:**
```typescript
// Will implement:
// - modules/workspace/update-member-action.ts
// - modules/workspace/remove-member-action.ts
// - Membership list component
```

#### 1.4 Workspace Settings
**Status:** ❌ Not started
**Dependencies:** Workspace creation ✅
**Effort:** 2 days
**Tasks:**
- [ ] Edit workspace name/slug
- [ ] Workspace avatar upload (future: Phase-7)
- [ ] Delete workspace (soft delete + archive)
- [ ] Workspace timezone settings

**Technical Details:**
```typescript
// Will implement:
// - modules/workspace/update-action.ts
// - modules/workspace/delete-action.ts
// - Settings page component
```

---

### Feature 2: Project Management

#### 2.1 Create Project
**Status:** ❌ Not started
**Dependencies:** Workspace creation ✅
**Effort:** 2-3 days
**Tasks:**
- [ ] Create project form in workspace
- [ ] Implement `modules/project/create-action.ts`
- [ ] Project repository with workspace scoping
- [ ] Project service with authorization
- [ ] Auto-assign project owner to creator

**Technical Details:**
```typescript
// Expected implementation
modules/project/
├── schemas.ts         // ✅ Exists - createProjectSchema
├── policies.ts        // ✅ Exists - canCreate, canRead, etc
├── repository.ts      // ❌ Implement: create, findById, findMany, update, delete
├── service.ts         // ❌ Implement: business logic + authorization
└── create-action.ts   // ❌ Implement: form → validation → service
```

#### 2.2 List & Filter Projects
**Status:** ❌ Not started
**Dependencies:** Create project ✅
**Effort:** 2 days
**Tasks:**
- [ ] Project list component with workspace context
- [ ] Filter by status (Active, Archived, Completed)
- [ ] Filter by owner/creator
- [ ] Search by name/description
- [ ] Sort by name, date, status
- [ ] Pagination (limit/offset)

**Technical Details:**
```typescript
// Repository method
async findMany(filter: ProjectFilterInput) {
  return db.project.findMany({
    where: {
      workspaceId: this.tenant.workspaceId,
      ...filter,
    },
    orderBy,
    take: limit,
    skip: offset,
  });
}
```

#### 2.3 View & Edit Project
**Status:** ❌ Not started
**Dependencies:** Create project ✅
**Effort:** 2-3 days
**Tasks:**
- [ ] Project detail page
- [ ] Edit project name/description/status
- [ ] Add project collaborators
- [ ] View project tasks
- [ ] Archive/restore project

**Technical Details:**
```typescript
// Will implement:
// - modules/project/update-action.ts
// - modules/project/archive-action.ts
// - Project detail component
```

#### 2.4 Delete Project
**Status:** ❌ Not started
**Dependencies:** Edit project ✅
**Effort:** 1 day
**Tasks:**
- [ ] Soft delete or cascade delete strategy
- [ ] Delete action with confirmation
- [ ] Audit log entry for deletion

---

### Feature 3: Task Management

#### 3.1 Create Task
**Status:** ❌ Not started
**Dependencies:** Create project ✅
**Effort:** 3 days
**Tasks:**
- [ ] Task form (title, description, priority, status)
- [ ] Implement `modules/task/create-action.ts`
- [ ] Task repository with workspace + project scoping
- [ ] Task service with authorization
- [ ] Auto-assign priority based on defaults

**Technical Details:**
```typescript
// Task fields to validate:
// - title: string (required, 1-200 chars)
// - description: string (optional, max 2000)
// - priority: enum (LOW, MEDIUM, HIGH, URGENT)
// - status: enum (BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED)
// - projectId: string (required, must exist in workspace)
// - assigneeId: string (optional, must be workspace member)
// - dueDate: date (optional)
```

#### 3.2 List Tasks & Board View
**Status:** ❌ Not started
**Dependencies:** Create task ✅
**Effort:** 3-4 days
**Tasks:**
- [ ] Task list component (table view)
- [ ] Task board component (kanban view with drag-drop)
- [ ] Filter by status, priority, assignee
- [ ] Search by title/description
- [ ] Bulk operations (reassign, status change)
- [ ] Export task list (CSV/PDF)

**Technical Details:**
```typescript
// Repository methods needed:
// - findMany(filter) - list with pagination
// - findByProject(projectId) - all tasks in project
// - findByAssignee(userId) - tasks assigned to user
// - Count methods for dashboard stats
```

#### 3.3 View & Edit Task
**Status:** ❌ Not started
**Dependencies:** Create task ✅
**Effort:** 2-3 days
**Tasks:**
- [ ] Task detail page/modal
- [ ] Edit task fields
- [ ] Change status with workflow validation
- [ ] Assign task to member
- [ ] Set due date with calendar picker
- [ ] Add task labels/tags

**Technical Details:**
```typescript
// Status workflow validation:
// BACKLOG → TODO → IN_PROGRESS → IN_REVIEW → DONE
//                ↓
//              BLOCKED → (back to IN_PROGRESS)

// Only allow valid transitions
```

#### 3.4 Task Dependencies
**Status:** ❌ Not started
**Dependencies:** View task ✅
**Effort:** 2 days
**Tasks:**
- [ ] Add task dependencies (blocks/blocked-by)
- [ ] Validate dependency chain (no circular)
- [ ] Show dependent tasks in detail view
- [ ] Prevent status change if dependencies not met

---

### Feature 4: Comments & Discussion

#### 4.1 Task Comments
**Status:** ❌ Not started
**Dependencies:** View task ✅
**Effort:** 2-3 days
**Tasks:**
- [ ] Comment form in task detail
- [ ] Implement `modules/comment/create-action.ts`
- [ ] Comment list with pagination
- [ ] Edit own comments
- [ ] Delete own comments
- [ ] Markdown support for comments

**Technical Details:**
```typescript
// Comment model exists in schema
// Will implement service layer:
modules/comment/
├── create-action.ts   // Create comment on task
├── update-action.ts   // Edit comment
├── delete-action.ts   // Delete comment
└── service.ts         // Authorization: only creator can edit/delete
```

#### 4.2 Mentions & Threading
**Status:** ❌ Not started - Phase-7
**Dependencies:** Task comments ✅
**Effort:** 2-3 days
**Tasks:**
- [ ] @mention support in comments
- [ ] Thread replies (comment on comment)
- [ ] Mention notifications
- [ ] Resolve conversations

---

### Feature 5: Notifications

#### 5.1 Notification System
**Status:** ❌ Not started
**Dependencies:** Comments & task assignment ✅
**Effort:** 3-4 days
**Tasks:**
- [ ] Notification types (task assigned, mentioned, etc)
- [ ] Notification center/list
- [ ] Mark notifications as read
- [ ] Notification preferences (frequency, channels)
- [ ] Dismiss notifications

**Technical Details:**
```typescript
// Notification types:
enum NotificationType {
  TASK_ASSIGNED,
  TASK_DUE_SOON,
  MEMBER_MENTIONED,
  APPROVAL_REQUESTED,
  COMMENT_REPLIED,
}

// Will implement:
modules/notification/
├── service.ts         // Create notification on events
├── list-action.ts     // Get user notifications
└── read-action.ts     // Mark as read
```

#### 5.2 Email Notifications
**Status:** ❌ Not started - Phase-7+
**Dependencies:** Notification system ✅
**Effort:** 2-3 days
**Tasks:**
- [ ] Email template system
- [ ] Send notification emails
- [ ] Digest emails (daily/weekly summary)
- [ ] Email preferences

---

### Feature 6: Approvals

#### 6.1 Approval Workflow
**Status:** ❌ Not started
**Dependencies:** Task management ✅
**Effort:** 3-4 days
**Tasks:**
- [ ] Create approval request on task
- [ ] Approval request list for reviewers
- [ ] Approve/reject with comments
- [ ] Status change on approval
- [ ] Approval history in task

**Technical Details:**
```typescript
// Approval states:
enum ApprovalStatus {
  PENDING,
  APPROVED,
  REJECTED,
  CANCELLED,
}

// Will implement:
modules/approval/
├── schemas.ts         // ✅ Exists
├── repository.ts      // Create, findPending, update
├── service.ts         // Business logic
├── create-action.ts   // Request approval
└── respond-action.ts  // Approve/reject
```

---

## Phase-7: Advanced Features

### Feature 1: User Profiles
**Status:** ❌ Not started
**Effort:** 2 days
- [ ] User profile page
- [ ] Edit profile (avatar, bio, timezone)
- [ ] Display member avatars throughout app
- [ ] User preferences (theme, notifications)

### Feature 2: File Attachments
**Status:** ❌ Not started
**Effort:** 3-4 days
**Dependencies:** Cloud storage setup (S3/Cloudinary)
- [ ] File upload in comments/tasks
- [ ] File storage with presigned URLs
- [ ] File size limits
- [ ] Virus scanning (optional)

### Feature 3: Real-Time Updates
**Status:** ❌ Not started
**Effort:** 4-5 days
**Dependencies:** WebSocket setup
- [ ] Live task updates
- [ ] Live comments (collaborate)
- [ ] Presence indicators (who's viewing)
- [ ] Optimistic UI updates

### Feature 4: Advanced Search
**Status:** ❌ Not started
**Effort:** 3-4 days
**Dependencies:** Search infrastructure (PostgreSQL FTS or Algolia)
- [ ] Full-text search across tasks/comments
- [ ] Saved searches
- [ ] Search filters
- [ ] Search analytics

### Feature 5: Analytics & Reporting
**Status:** ❌ Not started
**Effort:** 5-7 days
**Dependencies:** Data aggregation service
- [ ] Workspace activity dashboard
- [ ] Project completion metrics
- [ ] Team productivity stats
- [ ] Timeline/burndown charts
- [ ] Export reports (CSV/PDF)

---

## Phase-8+: Enterprise Features

### Feature 1: Authentication Enhancements
- [ ] Google/GitHub OAuth integration
- [ ] SAML for enterprise SSO
- [ ] Two-factor authentication (2FA)
- [ ] Passwordless authentication (passkeys)

### Feature 2: Security & Compliance
- [ ] Audit logging (all actions)
- [ ] Session management (active sessions, device control)
- [ ] API keys for external integrations
- [ ] SOC 2 compliance
- [ ] GDPR data export/deletion

### Feature 3: Billing & Pricing
- [ ] Stripe integration
- [ ] Usage-based billing
- [ ] Team/enterprise plans
- [ ] Invoice management
- [ ] Trial period management

### Feature 4: Integrations
- [ ] Slack integration (notifications, commands)
- [ ] GitHub integration (PR tracking)
- [ ] Jira integration (data sync)
- [ ] Calendar integration
- [ ] Zapier webhooks

### Feature 5: Mobile Apps
- [ ] React Native mobile app
- [ ] Offline-first sync
- [ ] Push notifications
- [ ] Mobile-optimized UI

---

## Technical Debt & Improvements

### Code Quality (Phase-6+)
- [ ] Add unit tests for all services
- [ ] Add integration tests for actions
- [ ] Add E2E tests for critical flows
- [ ] Add performance tests (load testing)
- [ ] Add accessibility audit (a11y)
- [ ] Add visual regression tests

### Observability (Phase-6+)
- [ ] Request logging to all route handlers
- [ ] Error tracking (Sentry/Datadog)
- [ ] Performance monitoring (New Relic)
- [ ] Database query optimization
- [ ] Slow query alarms
- [ ] API response time tracking

### Infrastructure (Phase-6+)
- [ ] Database indexing optimization
- [ ] Caching strategy (Redis)
- [ ] CDN setup for static assets
- [ ] Database backups automation
- [ ] Disaster recovery plan
- [ ] Load balancing setup

### Security (Phase-6+)
- [ ] Rate limiting by IP and user
- [ ] CSRF token rotation
- [ ] XSS protection review
- [ ] SQL injection prevention audit
- [ ] Dependency security scanning
- [ ] Regular penetration testing

---

## Implementation Priority Matrix

| Feature | Priority | Effort | Size | Target Phase |
|---------|----------|--------|------|------|
| **Workspace Management** | 🔴 Critical | 2w | S | Phase-6 |
| **Project Management** | 🔴 Critical | 2w | S | Phase-6 |
| **Task Management** | 🔴 Critical | 3w | M | Phase-6 |
| **Comments** | 🟡 High | 1w | S | Phase-6 |
| **Notifications** | 🟡 High | 2w | S | Phase-6 |
| **Approvals** | 🟡 High | 2w | M | Phase-6 |
| **Profiles** | 🟢 Medium | 3d | S | Phase-7 |
| **File Attachments** | 🟢 Medium | 1w | S | Phase-7 |
| **Real-Time** | 🟢 Medium | 2w | L | Phase-7 |
| **Search** | 🟢 Medium | 1w | M | Phase-7 |
| **Analytics** | 🟢 Medium | 2w | L | Phase-7 |
| **OAuth** | 🔵 Low | 1w | S | Phase-8 |
| **2FA** | 🔵 Low | 1w | S | Phase-8 |
| **Billing** | 🔵 Low | 3w | L | Phase-8 |

---

## Phase-6 Estimated Timeline

**Assuming 5 developers, 2-week sprints:**

### Week 1-2: Workspace & Project (Core Infrastructure)
- Workspace CRUD (1 dev)
- Project CRUD (1 dev)
- Unit tests (1 dev)
- Styling & responsive design (1 dev)

### Week 3-4: Task Management (Largest Feature)
- Task CRUD (2 devs)
- Task board/list components (1 dev)
- Tests & styling (1 dev)

### Week 5-6: Comments & Notifications
- Comment system (1 dev)
- Notification system (1 dev)
- Tests & styling (1 dev)

### Week 7-8: Approvals & Polish
- Approval workflow (1 dev)
- Integration testing (1 dev)
- Performance optimization (1 dev)
- Security audit (1 dev)

**Total:** 8 weeks (2 months) for Phase-6 MVP with team of 5

---

## Code Review Checklist for Phase-6

Every PR should verify:

- [ ] Follows Phase-5 patterns (schemas → service → repository → action)
- [ ] Uses ActionResult for all server actions
- [ ] Workspace-scoped queries in repository
- [ ] Authorization check in service (before data access)
- [ ] All errors caught and mapped properly
- [ ] No duplicate Zod schemas
- [ ] Database queries optimized (no N+1)
- [ ] Accessibility tested (keyboard, screen reader)
- [ ] Mobile responsive (tested at 375px width)
- [ ] Dark mode considered (if applicable)
- [ ] Tests added (unit + integration)
- [ ] Error messages user-friendly
- [ ] No hardcoded values (use constants)
- [ ] Type-safe (no `any` types)
- [ ] Request logging for auditable actions

---

## Sign-Off

**This document is the master roadmap for Phase-6+ development.**

Keep this updated as features are completed. Move features to "Completed" section and link to PR/commit.

**Questions?** Refer to:
- Phase-5 patterns: `docs/phase-5-architecture.md`
- Code review: `docs/implementation-review.md`
- Decisions: `docs/decisions.md`
