# Analytics Route Testing Guide

## 📍 Route Location & Structure

### URL Path
```
/workspace/[workspaceId]/analytics
```

### File Structure
```
app/
├── workspace/
│   └── [workspaceId]/
│       ├── analytics/
│       │   ├── page.tsx          ← Main dashboard page
│       │   └── loading.tsx       ← Loading skeleton
│       └── layout.tsx            ← Workspace layout (provides context)
```

### Component Structure
```
components/
└── analytics/
    ├── tasks-by-status-chart.tsx       ← Bar chart: Tasks grouped by status
    ├── overdue-tasks-list.tsx          ← Table: Overdue tasks
    ├── cycle-time-chart.tsx            ← Bar chart: Days to completion
    ├── workload-chart.tsx              ← List: Open tasks per assignee
    └── approval-turnaround-chart.tsx   ← Cards: Reviewer metrics
```

### Data Layer
```
modules/
└── analytics/
    ├── repository.ts    ← Prisma aggregation (server-side)
    ├── service.ts       ← Business logic layer
    └── types.ts         ← TypeScript interfaces
```

---

## 🔌 Data Flow (Server-Side)

### Step 1: Authentication & Authorization
```
analytics/page.tsx → Line 23
├─ auth() → Get user session
├─ resolveTenantContext() → Verify workspace access
└─ Return 404 if unauthorized
```

**Code Location**: [analytics/page.tsx](app/workspace/[workspaceId]/analytics/page.tsx#L23-L35)

### Step 2: Initialize Analytics Service
```
analytics/page.tsx → Line 37
├─ new AnalyticsService(tenant)
└─ Service receives TenantContext with workspaceId
```

**Code Location**: [analytics/page.tsx](app/workspace/[workspaceId]/analytics/page.tsx#L37-L38)

### Step 3: Parallel Data Aggregation
```
service.getDashboardData() → service.ts Line 18-27
├─ repository.getOverallMetrics()      ← Metric counts
├─ repository.getTasksByStatus()       ← Status distribution
├─ repository.getOverdueTasks(20)      ← Top 20 overdue
├─ repository.getCycleTimeByProject()  ← Completion days
├─ repository.getWorkloadByAssignee()  ← Open tasks/person
└─ repository.getApprovalTurnaroundByReviewer() ← Review metrics
```

**All queries run in parallel** (`Promise.all()`)

**Code Location**: [service.ts](modules/analytics/service.ts#L18-L27)

### Step 4: Pass Data to Components
```
analytics/page.tsx → Line 55-150
├─ TasksByStatusChart({ data: tasksByStatus })
├─ WorkloadChart({ data: workload, workspaceId })
├─ CycleTimeChart({ data: cycleTime })
├─ ApprovalTurnaroundChart({ data: approvals })
└─ OverdueTasksList({ tasks: overdueTasks, workspaceId })
```

**Code Location**: [analytics/page.tsx](app/workspace/[workspaceId]/analytics/page.tsx#L85-L150)

---

## 🛠️ How It's Maintained

### 1. **Data Accuracy**
- **Repository** handles all aggregation via Prisma groupBy/count
- **No client-side calculations** - all data is server-aggregated
- **Single source of truth** - repository.ts is the only data source

**Maintenance**: Update `repository.ts` if data calculations change

### 2. **Component Maintenance**
- **Client-side components** receive clean data objects
- **No data fetching** in components (all in service layer)
- **Props are typed** via TypeScript interfaces

**Maintenance**: Update component props in `service.ts` return types

### 3. **Service Layer Maintenance**
- **AnalyticsService** orchestrates all queries
- **getDashboardData()** is the public API
- **All queries run in parallel** for performance

**Maintenance**: Add new methods to AnalyticsService for new metrics

---

## ✅ Step-by-Step Testing Plan

### Test 1: Route Accessibility
```bash
# Navigate to this URL in your browser
/workspace/{workspaceId}/analytics

# Expected: Loading skeleton appears immediately
# Expected: Dashboard loads after 1-3 seconds
```

### Test 2: Verify Each Section Renders
- [ ] Metric Cards (4 cards at top)
  - Total Tasks
  - Completed Tasks
  - Open Tasks
  - Overdue Tasks

- [ ] Tasks by Status Chart
  - Horizontal bars for each status
  - Counts match database

- [ ] Team Workload
  - One row per assignee
  - Color-coded by load (red = heavy)
  - Link to filtered projects page

- [ ] Cycle Time Chart
  - One bar per project
  - Only counts DONE tasks
  - Shows days to completion

- [ ] Approval Turnaround
  - One card per reviewer
  - Shows avg response time
  - Progress bar for approval rate

- [ ] Overdue Tasks List
  - Table with pagination
  - Tasks sorted by due date (oldest first)
  - Days overdue in red

### Test 3: Verify Data Accuracy
```bash
# In database, query by hand:
SELECT status, COUNT(*) FROM Task GROUP BY status

# Compare with "Tasks by Status" chart
# Numbers should match exactly
```

### Test 4: Verify Links Work
```
# Click assignee in Workload section
→ Should navigate to /workspace/[id]/projects?assignee=[id]

# Click task in Overdue list  
→ Should navigate to task detail page
```

### Test 5: Check Performance
```bash
# Open DevTools → Network tab
# Reload /analytics page

# Expected:
# - page.tsx loads in <100ms
# - All data returned in 1-3 seconds
# - No waterfall requests (parallel execution)
```

### Test 6: Verify Error Handling
```
# If user not authenticated:
→ Redirect to /auth/login

# If user not in workspace:
→ Return 404 Not Found

# If no tasks in workspace:
→ Show "No data available" message
```

---

## 🧪 Testing Commands

### Build & Type Check
```bash
cd c:\flowforge\flowforge

# Build project
npm run build

# Type check analytics files only
npx tsc --noEmit --skipLibCheck
```

### Run Development Server
```bash
# Start dev server
npm run dev

# Navigate to:
# http://localhost:3000/workspace/{workspaceId}/analytics
```

### Check Build Output
```bash
# Size of analytics route bundle
npm run build && ls -la .next/static/chunks

# Should show compiled page and components
```

---

## 📊 Data Sources & Queries

### Overall Metrics (4 cards)
**Source**: `repository.getOverallMetrics()`
- Query: COUNT(*) WHERE status != 'DONE'
- Query: COUNT(*) WHERE status = 'DONE'  
- Query: COUNT(*) WHERE dueDate < NOW()
- Query: SUM() for averages

### Tasks by Status Chart
**Source**: `repository.getTasksByStatus()`
```sql
SELECT status, COUNT(*) as count
FROM Task
GROUP BY status
ORDER BY count DESC
```

### Workload Chart
**Source**: `repository.getWorkloadByAssignee()`
```sql
SELECT 
  assignee_id,
  COUNT(*) as openTaskCount
FROM Task
WHERE status != 'DONE'
GROUP BY assignee_id
```

### Cycle Time
**Source**: `repository.getCycleTimeByProject()`
```sql
SELECT 
  project_id,
  AVG(DATEDIFF(day, created_at, updated_at)) as avgDays
FROM Task
WHERE status = 'DONE'
GROUP BY project_id
```

---

## 🔄 Update Cycle

### Adding a New Metric
1. **Add method to AnalyticsRepository** (`modules/analytics/repository.ts`)
2. **Add method to AnalyticsService** (`modules/analytics/service.ts`)
3. **Create chart component** (`components/analytics/new-chart.tsx`)
4. **Update analytics page** (`app/workspace/[workspaceId]/analytics/page.tsx`)
5. **Update loading skeleton** (`app/workspace/[workspaceId]/analytics/loading.tsx`)

### Fixing Incorrect Data
1. Check **repository.ts** - verify aggregation query
2. Check **service.ts** - verify transformation logic
3. Check **component** - verify data prop names
4. Test in browser → DevTools → Network tab

---

## 🚀 Deployment Checklist

Before deploying Phase 11 to production:

- [ ] All 5 chart components render correctly
- [ ] Data matches database queries
- [ ] Loading skeleton matches final layout
- [ ] Links navigate to correct pages
- [ ] No console errors in browser DevTools
- [ ] Build succeeds: `npm run build`
- [ ] TypeScript check passes: `npx tsc --noEmit`
- [ ] Performance: Page loads data in <3 seconds
- [ ] All team members can access own workspace analytics

---

## 📚 Key Files Reference

| File | Purpose | Maintenance |
|------|---------|-------------|
| [repository.ts](modules/analytics/repository.ts) | Prisma queries | Update when query logic changes |
| [service.ts](modules/analytics/service.ts) | Business logic | Update when adding new metrics |
| [page.tsx](app/workspace/[workspaceId]/analytics/page.tsx) | Server component | Update when adding new charts |
| [loading.tsx](app/workspace/[workspaceId]/analytics/loading.tsx) | Loading UI | Keep in sync with page.tsx layout |
| [*-chart.tsx](components/analytics/) | Chart components | Update styling/props |

---

## ⚠️ Common Issues & Solutions

### Issue: "Chart shows wrong numbers"
**Solution**: 
1. Check repository.ts aggregation query
2. Verify no filters are hiding data
3. Compare with direct database query

### Issue: "Page takes >5 seconds to load"
**Solution**:
1. Check if queries are running sequentially (should be parallel)
2. Review Promise.all() in service.ts
3. Check database indexes on grouping columns

### Issue: "Loading skeleton doesn't match final layout"
**Solution**:
1. Update loading.tsx to match page.tsx structure
2. Ensure same grid/flex layouts
3. Keep skeleton placeholder heights consistent

### Issue: "Unauthorized user can see data"
**Solution**:
1. Verify resolveTenantContext() is called
2. Check auth() middleware is active
3. Ensure workspace_id filter in all queries

---

## 🎯 Summary

### Route Structure: ✅ Clear
- Single file per feature (page.tsx, loading.tsx)
- Components in dedicated analytics folder
- Service layer separates data from UI

### Maintenance: ✅ Clear  
- All data flows through service layer
- Repository handles aggregation
- Components are presentation-only

### Functionality: ✅ Testable
- Each component has typed props
- Data is immutable from server
- No real-time updates needed

---

Last Updated: April 1, 2026
Phase 11: Analytics Dashboard
