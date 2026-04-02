# Phase-6+ Code Review Checklist

Every PR for Phase-6 and beyond must verify these items before merging.

## Authentication & Authorization

- [ ] `requireUser()` called at the top of protected pages/layouts
- [ ] `resolveTenantContext()` called in workspace layouts before rendering children
- [ ] `ForbiddenError` thrown for access violations (caught by `error.tsx`)
- [ ] `NotFoundError` thrown when resource doesn't exist
- [ ] All workspace queries filtered by `workspaceId` from tenant context
- [ ] No unauthenticated users can access `/workspace/*` routes
- [ ] No non-members can access workspace data

## Service & Repository Layer

- [ ] Service methods accept `TenantContext` in constructor
- [ ] Service checks authorization BEFORE accessing data (policy check first)
- [ ] Repository methods accept `TenantContext` in constructor
- [ ] All repository queries filter by `tenant.workspaceId`
- [ ] No Prisma calls in pages, layouts, or components (only in repositories)
- [ ] `include`/`select` used to prevent N+1 queries
- [ ] No hardcoded user IDs or workspace IDs in queries

## Server Components (Pages & Layouts)

- [ ] Pages and layouts are server components by default
- [ ] Data fetching happens in server components, not components
- [ ] Pages are under 40 lines (business logic delegated to components)
- [ ] Layouts are thin shells (fetch data, render structure)
- [ ] No useState/useEffect in server components
- [ ] All data dependencies resolved before rendering

## Client Components

- [ ] Mark with `'use client'` only when necessary (event handlers, hooks)
- [ ] Accept only typed props (no data fetching)
- [ ] No Prisma calls or database operations
- [ ] No fetch() calls without `use server` wrapper
- [ ] Components are presentational/dumb by design

## Error Handling

- [ ] `error.tsx` file present at every dynamic `[param]` segment
- [ ] `error.tsx` marked with `'use client'` directive
- [ ] Error boundary catches and displays `ForbiddenError` (403)
- [ ] Error boundary catches and displays `NotFoundError` (404)
- [ ] Error messages are user-friendly (not stack traces)
- [ ] Reset button calls provided `reset()` function

## Loading States

- [ ] `loading.tsx` file present at every async data segment
- [ ] Loading skeleton matches layout structure (prevents CLS)
- [ ] Skeletons use `animate-pulse` for visual feedback
- [ ] No loading fallback inside `Page` component (use `loading.tsx`)

## Types & TypeScript

- [ ] No `any` types anywhere
- [ ] All props typed explicitly
- [ ] Imports use absolute paths (`@/...`)
- [ ] Interface names match export names (e.g., `UserWithProfile`)
- [ ] Enums imported from `@/lib/generated/prisma`
- [ ] TypeScript strict mode enabled (no `tsconfig.json` relaxation)

## Code Quality

- [ ] No hardcoded user-visible strings (extract to constants)
- [ ] Component names follow convention: `PascalCase` for files and exports
- [ ] Consistent spacing and indentation
- [ ] Comments explain WHY, not WHAT (code should be self-documenting)
- [ ] No console.log or debug statements left

## Component Structure

- [ ] Components in `components/` accept only props
- [ ] Layout components are in `components/layout/`
- [ ] Feature components are in `components/[feature]/`
- [ ] Utility components are in `components/ui/`
- [ ] Each component focused on single responsibility
- [ ] Compound components (layout + content) use proper nesting

## Database Queries

- [ ] Queries specify exact fields with `select` (not fetching entire rows)
- [ ] Related data loaded with `include`, not separate queries
- [ ] No loops with queries inside (`for`/`map` with async operations)
- [ ] Pagination implemented with `take`/`skip` for large datasets
- [ ] Database indexes used appropriately for workspace filtering

## File Organization

- [ ] App Router nested in proper folders and group syntax
- [ ] Module structure: `modules/[domain]/{repository,service,schemas,policies,types}.ts`
- [ ] Layout, page, loading, error kept together in route segment folder
- [ ] No files in wrong locations (e.g., utils in pages)

## Routing & Navigation

- [ ] Links use `href` with full paths: `/workspace/[id]/projects`
- [ ] Query parameters handled via `searchParams` prop
- [ ] Dynamic routes use `[param]` convention
- [ ] Route groups use `(group)` syntax for non-URL-affecting organization
- [ ] No client-side routing inside server components

## Accessibility & UX

- [ ] Error messages are helpful and actionable
- [ ] Empty states provide context (not just "no data")
- [ ] Loading feedback prevents perception of hang
- [ ] Buttons and links have clear labels
- [ ] Form inputs have associated labels (future phases)

## Testing & Verification

- [ ] `npx tsc --noEmit` passes (zero TypeScript errors)
- [ ] App builds without errors: `npm run build`
- [ ] Manual testing: visit `/workspace/[id]` renders without errors
- [ ] Manual testing: non-member trying `/workspace/[id]` shows 403
- [ ] Manual testing: logged-out user trying `/workspace/[id]` redirects to login

## Documentation

- [ ] Inline code comments for complex logic
- [ ] JSDoc comments for exported functions
- [ ] Update [architecture.md](./architecture.md) if adding new patterns
- [ ] Update [decisions.md](./decisions.md) if making architectural decisions
- [ ] No TODOs or FIXMEs without context

## Phase-6 Specific

- [ ]  No mutations (create, update, delete) in this phase
- [ ] No forms or form submissions
- [ ] No task/comment/approval/notification features
- [ ] Read-only display only
- [ ] Empty states for future features (placeholder, not implemented)

---

## Before Merging

**Checklist Owner Responsibility:**
1. Run through checklist items above
2. Mark incomplete items for author to fix
3. Test in browser (all three paths: happy, 403, 404)
4. Verify TypeScript compiles
5. Use React DevTools to inspect component tree
6. Check Network tab for N+1 queries - should see single request per page

**Final Steps:**
- [ ] Squash commits (clean history)
- [ ] Write descriptive PR title and body
- [ ] Link to related issue/task
- [ ] Approve and merge

---

## Common Mistakes to Catch

| ❌ | ✅ |
|---|---|
| `const data = await fetch()` in component | Data fetched in server component,passed as prop |
| `db.query()` in page file | Repository method called from service |
| No authorization check | Policy check in service BEFORE data access |
| Component exports async function | Client components never async (use server components) |
| `loading.tsx` inside `Page` component | Use dedicated `loading.tsx` file |
| `error.tsx` without `'use client'` | All error boundaries must be client components |
| N+1 database queries | Use `include`/`select` for related data |
| Hardcoded workspace ID | Use `tenant.workspaceId` from context |
| `any` type used | Specify exact type instead |
|`useEffect` data fetching | Move to server component |

---

## Questions?

- See [architecture.md](./architecture.md) for Phase-6 read flow patterns
- See [phase-5-architecture.md](./phase-5-architecture.md) for service/repository patterns  
- See [decisions.md](./decisions.md) for WHY these patterns exist
