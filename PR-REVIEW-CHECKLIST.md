# Pull Request Review Checklist

**Purpose**: Standard checklist for code reviewers to ensure quality, security, and consistency across all PRs.

**Who**: All contributors must address these items before merge.

---

## ✅ Pre-Submission Checklist (Author)

### Code Quality
- [ ] Code is formatted (`npm run format`)
- [ ] Linter passes (`npm run lint`)
- [ ] TypeScript checks pass (`npm run typecheck`)
- [ ] No console.log statements (except intentional debug)
- [ ] No commented-out code
- [ ] DRY principle followed (no duplicated logic)
- [ ] Meaningful variable/function names (no `x`, `temp`, etc.)
- [ ] Functions have JSDoc comments if complex
- [ ] Functions are ≤50 lines (split if larger)

### Testing
- [ ] New tests added for new code
- [ ] Tests pass locally (`npm run test`)
- [ ] Test coverage maintained (≥80% for touched files)
- [ ] Edge cases tested (null, empty, errors)
- [ ] Mocks are appropriate (not over-mocked)

### Functionality
- [ ] Feature works as described
- [ ] No regressions in existing features
- [ ] Error handling added
- [ ] Error messages are user-friendly
- [ ] Loading states handled
- [ ] Edge cases considered

### Git Hygiene
- [ ] Commits are logical and atomic
- [ ] Commit messages are clear (`fix: issue`, `feat: feature`, `refactor:`)
- [ ] No merge commits (rebase if needed)
- [ ] Branch is up-to-date with main
- [ ] Only relevant changes included

---

## Security Review (Reviewer Priority: 🔴 HIGH)

### Authentication & Authorization
- [ ] **TenantContext Usage**: Every query filters by `workspaceId`
  ```typescript
  // ✅ Good
  return prisma.task.findMany({
    where: { workspaceId: this.tenant.workspaceId, ... }
  });
  
  // ❌ Bad (missing workspaceId filter)
  return prisma.task.findMany({
    where: { id: taskId }
  });
  ```

- [ ] **Policy Checks**: Authorization policy applied before mutations
  ```typescript
  // ✅ Good
  if (!TaskPolicy.canUpdate(this.tenant, task)) {
    throw new ForbiddenError('Cannot update task');
  }
  
  // ❌ Bad (missing check)
  return this.repo.updateTask(taskId, data);
  ```

- [ ] **No Role Bypass**: Role checks not bypassed for any user
- [ ] **Workspace Isolation**: User cannot access other workspaces

### Input Validation & Sanitization
- [ ] **Sanitization Applied**: All user inputs sanitized
  ```typescript
  // ✅ Good
  const clean = sanitizeText(input.title);
  await this.repo.create({ title: clean });
  
  // ❌ Bad (no sanitization)
  await this.repo.create({ title: input.title });
  ```

- [ ] **HTML Content**: Comments use `sanitizeCommentBody()`
- [ ] **No Script Injection**: Can't inject `<script>` tags
- [ ] **URL Validation**: URLs validated before storing
- [ ] **Zod Schemas**: Input validated with Zod if applicable

### Rate Limiting
- [ ] **Protected Endpoints**: Rate limiting applied to sensitive endpoints
  ```typescript
  // ✅ Good
  const limit = signinLimiter.check(email);
  if (!limit.allowed) returnTooManyRequests();
  
  // ❌ Bad (no rate limiting)
  await authenticateUser(email, password);
  ```

- [ ] **Appropriate Limits**: Limits match endpoint risk (signin: strict, read: loose)
- [ ] **Retry-After Header**: Included in 429 response

### Error Handling
- [ ] **No Sensitive Info in Errors**: Stack traces only in logs
- [ ] **Generic Client Messages**: "Something went wrong" vs "SQL error"
- [ ] **Server Logging**: Detailed errors logged server-side
- [ ] **Sentry Integration**: Errors tracked in Sentry

### API Routes
- [ ] **HTTPS Only**: No http:// routes in production
- [ ] **CORS Configured**: If needed, properly scoped
- [ ] **No Secrets in Code**: API keys from env vars
- [ ] **No Default Credentials**: No hardcoded test user/password

---

## Functionality Review (Reviewer Priority: 🟡 MEDIUM)

### Feature Completeness
- [ ] **Matches Requirements**: Feature matches description
- [ ] **Edge Cases Handled**: Null, empty, error paths
- [ ] **Validation**: Input validated before use
- [ ] **Error States**: User sees appropriate error messages

### User Experience
- [ ] **Loading States**: Spinners while loading
- [ ] **Success Confirmation**: User knows action succeeded
- [ ] **Undo Capability**: Reversible actions have undo
- [ ] **Mobile Responsive**: Works on small screens
- [ ] **Keyboard Accessible**: Tab navigation works

### Performance
- [ ] **No N+1 Queries**: Related data loaded efficiently
  ```typescript
  // ✅ Good (include with query)
  await prisma.task.findMany({
    include: { assignee: true, comments: true }
  });
  
  // ❌ Bad (N+1 in loop)
  for (const task of tasks) {
    task.assignee = await getUser(task.assigneeId); // Repeat query!
  }
  ```

- [ ] **Pagination Applied**: Large lists paginated
- [ ] **Indexes Used**: Database indexes used for filters
- [ ] **No Unnecessary Queries**: Redundant database calls removed

---

## Code Style & Maintainability (Reviewer Priority: 🟢 LOW)

### TypeScript Best Practices
- [ ] **Type Safety**: No `any` types (except unavoidable)
  ```typescript
  // ✅ Good
  async getTask(id: string): Promise<Task> { }
  
  // ❌ Bad
  async getTask(id: any): Promise<any> { }
  ```

- [ ] **Strict Mode**: Uses `strict: true` in tsconfig
- [ ] **Generics Used**: Where appropriate for reusability
- [ ] **Type Exports**: Public types exported from modules

### Code Organization
- [ ] **Single Responsibility**: Function does one thing
- [ ] **Module Structure**: Follows `/modules/{feature}` pattern
- [ ] **Imports Organized**: `node` → `@/` → relative
- [ ] **Constants Extracted**: Magic numbers/strings in constants

### Comments & Documentation
- [ ] **Why, Not What**: Comments explain intent, not obvious code
  ```typescript
  // ✅ Good
  // Soft delete to preserve audit trail
  update({ deletedAt: new Date() })
  
  // ❌ Bad
  // Set deletedAt to now
  update({ deletedAt: new Date() })
  ```

- [ ] **JSDoc for Public APIs**: Functions exported have docs
- [ ] **Link Issues**: Comments reference issue numbers
- [ ] **No TODO**: TODOs have issues, not orphaned in code

### Testing
- [ ] **Test Names Are Clear**: Describe what's tested
  ```typescript
  // ✅ Good
  it('should throw ForbiddenError when user cannot update', ...)
  
  // ❌ Bad
  it('test update', ...)
  ```

- [ ] **Arrange-Act-Assert**: Tests follow AAA pattern
- [ ] **No Mock Leaks**: Mocks cleaned up in afterEach
- [ ] **Real Infrastructure**: Integration tests use real DB

---

## Accessibility Review (Reviewer Priority: 🟡 MEDIUM)

### For UI/Component Changes

- [ ] **Keyboard Navigation**: Can use Tab/Enter/Escape
- [ ] **Screen Reader**: ARIA labels on interactive elements
  ```typescript
  // ✅ Good
  <button aria-label="Close dialog">×</button>
  
  // ❌ Bad
  <button>×</button>
  ```

- [ ] **Color Contrast**: Text meets WCAG AA (4.5:1)
- [ ] **Focus Visible**: Keyboard users see focus indicator
- [ ] **Form Labels**: All inputs have associated labels
- [ ] **Error Messages**: Clearly associated with fields

---

## Database/Schema Review (Reviewer Priority: 🔴 HIGH)

### Schema Changes
- [ ] **Migration Needed**: .prisma changes have migration
- [ ] **Backward Compatible**: Doesn't break production
- [ ] **Indexes Added**: New lookup columns indexed
- [ ] **Constraints Appropriate**: Unique, foreign keys correct
- [ ] **Nullable Fields**: `?` used appropriately
- [ ] **Defaults Set**: Sensible defaults provided

### Queries
- [ ] **WHERE Clause**: All queries filter appropriately
- [ ] **No Unplanned Updates**: Update queries have conditions
- [ ] **Transactions**: Multi-step operations atomic
- [ ] **Performance**: Complex queries analyzed for index usage

---

## DevOps/Deployment (Reviewer Priority: 🟡 MEDIUM)

### Environment Variables
- [ ] **No Hardcoded Secrets**: API keys in env vars
- [ ] **Documentation**: .env.example updated
- [ ] **Validation**: env vars validated on startup
- [ ] **Defaults Safe**: Defaults don't compromise security

### Build & Deployment
- [ ] **Build Passes**: `npm run build` succeeds
- [ ] **No Build Warnings**: Clean build output
- [ ] **Tests Pass**: `npm run test` all pass
- [ ] **Lint Clean**: `npm run lint` no errors

---

## Review Decision

### Approval Criteria (✅ All Must Pass)

**All of these must be YES**:
1. ✅ Security checklist (all items)
2. ✅ Tests pass locally
3. ✅ No regressions in existing features
4. ✅ Code is readable and maintainable
5. ✅ Commit history is clean

### Common Blockers (🛑 Stop & Reassess)

- ❌ Missing TenantContext filter (CRITICAL)
- ❌ No authorization policy check (CRITICAL)
- ❌ Unsanitized user input (CRITICAL)
- ❌ Failing tests
- ❌ `any` types throughout
- ❌ N+1 query patterns
- ❌ No tests for new code
- ❌ Mixing concerns (service doing repo work)

### Approve If
- ✅ All security items reviewed
- ✅ Tests pass and cover changes
- ✅ No existing features broken
- ✅ Code follows project patterns
- ✅ Performance acceptable

### Request Changes If
- 🟡 Security questions need clarification
- 🟡 Tests incomplete
- 🟡 Error handling missing
- 🟡 Performance concerns
- 🟡 Code clarity issues

---

## Review Comments Template

### For Security Issues
```markdown
**Security Concern**

This query is missing the workspaceId filter, allowing cross-tenant access.

**Suggestions**:
```typescript
// Instead of:
prisma.task.findMany({ where: { id: taskId } })

// Use:
prisma.task.findMany({
  where: { id: taskId, workspaceId: this.tenant.workspaceId }
})
```

**Risk**: High - Data leak between workspaces
**Blocking**: Yes
```

### For Style Issues
```markdown
**Code Quality**

This function is doing too much. Consider splitting into smaller functions.

**Current**: Fetches, validates, transforms, persists
**Suggested**: Separate into `fetch()`, `validate()`, `transform()`, `persist()`

**Blocking**: No
```

### For Suggestions
```markdown
**Performance Note**

This could be faster with a database index:

```sql
CREATE INDEX ON Task(workspaceId, status);
```

No change required, but good for future optimization.
```

---

## Reviewer Expectations

| Aspect | Time | Expectation |
|--------|------|------------|
| Security | 20% | Deep dive, ask questions |
| Testing | 20% | Verify coverage, edge cases |
| Functionality | 30% | Run locally if needed |
| Style/Maintainability | 30% | Skim, focus on patterns |

**Total Review Time**: 30-45 minutes per PR

**Approval SLA**: Within 24 hours

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| ❌ No workspaceId filter | ✅ Add `workspaceId: this.tenant.workspaceId` to where clause |
| ❌ User input in database | ✅ Call `sanitizeText()` before persisting |
| ❌ No tests | ✅ Add unit tests covering happy path + error cases |
| ❌ Hardcoded API key | ✅ Move to env var, add to .env.example |
| ❌ Nested loops (N+1) | ✅ Use `include: { related: true }` in single query |
| ❌ Unhandled promise | ✅ Add `.catch()` or `await with try/catch` |

---

**Last Updated**: April 2, 2026  
**Status**: ✅ Complete | 38 Review Items | 3 Critical Security Gates
