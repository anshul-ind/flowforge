# Phase 10: Search UI Location Guide

## Where Search Appears in the UI

### 1. **Command Palette (Cmd+K)** - GLOBAL
**Where**: Anywhere in the workspace
**How to access**: Press `Cmd+K` (Mac) or `Ctrl+K` (Windows)
**Appears as**: Modal overlay in center of screen

```
┌─────────────────────────────────────────┐
│  [Search projects, tasks...] [ESC]      │
├─────────────────────────────────────────┤
│ PROJECTS                                │
│ • Website Redesign                      │
│ • Mobile App v2                         │
├─────────────────────────────────────────┤
│ TASKS                                   │
│ • Design Homepage                       │
│ • Fix Login Bug                         │
└─────────────────────────────────────────┘
```

**Status**: ✅ Already integrated in layout (Press Cmd+K to test)

---

### 2. **Search Results Page**
**URL**: `/workspace/{workspaceId}/search?q={query}`
**Where**: Dedicated search page

**Layout**:
```
Search results for "design"          [Found 12 results]
┌────────────────────────────────────────────┐
│ All Results (12) │ Projects (4) │ Tasks (8)│
├────────────────────────────────────────────┤
│ PROJECTS                                   │
│ ┌──────────────────────────────────────┐  │
│ │ Website Redesign                 ACTIVE│  │
│ │ Update the company website             │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ TASKS                                      │
│ ┌──────────────────────────────────────┐  │
│ │ Design Homepage     HIGH   IN_PROGRESS│  │
│ │ Website Redesign › Design landing...  │  │
│ └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

**Status**: ✅ Created at `/workspace/[workspaceId]/search/page.tsx`
**How to access**: 
- Direct URL: `/workspace/{id}/search?q=design`
- Command Palette: Type query and press Enter

---

### 3. **Projects Listing Page with Filters**
**URL**: `/workspace/{workspaceId}/projects`
**Where**: Top of projects list

**Layout**:
```
Projects
┌────────────────────────────────────────────┐
│ Filters  ▼                                 │
├────────────────────────────────────────────┤
│ Status    │ Status    │ Status    │        │
│ PLANNING  │ ACTIVE    │ PAUSED    │ ...    │
│                                            │
│ Team Members                               │
│ [Alice] [Bob] [Charlie]                    │
│                                            │
│ Created After [____]  Created Before [____]│
│                            Clear all filters│
└────────────────────────────────────────────┘

Project Grid:
┌─────────────────────────┬─────────────────┐
│ Website Redesign  ACTIVE│ Mobile App v2   │
│ Update company website  │ NEW FEATURE      │
└─────────────────────────┴─────────────────┘
```

**Status**: ⚠️ Page exists but filter bar NOT integrated yet
**Action Needed**: Add `ProjectFilterBar` to `/workspace/[workspaceId]/projects/page.tsx`

---

### 4. **Project Detail Page with Task Filters**
**URL**: `/workspace/{workspaceId}/project/{projectId}`
**Where**: Above task list

**Layout**:
```
Project: Website Redesign

Tasks (24)
┌────────────────────────────────────────────┐
│ Filters  ▼                                 │
├────────────────────────────────────────────┤
│ Status    │ Status    │ Status             │
│ OPEN      │ IN_PROG   │ REVIEW    │ DONE  │
│                                            │
│ Priority                                   │
│ LOW │ MEDIUM │ HIGH │ URGENT              │
│                                            │
│ Due Date                                   │
│ Today │ This Week │ This Month │ Overdue  │
│                            Clear all filters│
└────────────────────────────────────────────┘

Task List:
┌──────────────────────────────────────┐
│ Design Homepage      HIGH   OPEN      │
│ Fix Login Bug        URGENT IN_PROG   │
│ Update Profile Page  MEDIUM REVIEW    │
└──────────────────────────────────────┘
```

**Status**: ⚠️ Page exists but filter bar NOT integrated yet
**Action Needed**: Add `TaskFilterBar` to `/workspace/[workspaceId]/project/[projectId]/page.tsx`

---

## Integration Status

| Feature | Location | Status | Visible |
|---------|----------|--------|---------|
| Command Palette | Global (Layout) | ✅ Done | Try Cmd+K |
| Search Results Page | `/search?q=...` | ✅ Created | Navigate via URL |
| Projects Filter Bar | `/projects` page | ⚠️ Not integrated | Add component |
| Task Filter Bar | `/project/[id]` page | ⚠️ Not integrated | Add component |
| Search links | Navigation | ❌ Not done | Add search input |

---

## What You'll See When Complete

### After you press Cmd+K:
✅ Modal appears with search overlay
✅ Type "design" and see matching projects/tasks
✅ Use arrow keys to navigate
✅ Press Enter to jump to project/task

### After you visit `/workspace/{id}/search?q=design`:
✅ See all search results in a full page
✅ Click tabs to filter (Projects/Tasks)
✅ Click any result to navigate

### After you visit `/workspace/{id}/projects`:
⚠️ Currently no filters shown
→ Need to add `ProjectFilterBar` component
→ Then you'll see status, member, and date filters

### After you visit `/workspace/{id}/project/{projectId}`:
⚠️ Currently no filters on task list
→ Need to add `TaskFilterBar` component
→ Then you'll see status, priority, and due date filters

---

## Next Steps to Make Everything Visible

1. ✅ **Command Palette**: Already integrated - TEST IT NOW with Cmd+K
2. ✅ **Search Page**: Already created - TEST IT at `/workspace/{id}/search?q=test`
3. ⏳ **Update Projects Page**: Add ProjectFilterBar (next)
4. ⏳ **Update Project Detail Page**: Add TaskFilterBar (next)
5. ⏳ **Add Search Link**: Navbar search to `/search` page (optional)

---

**Current Status**: Components created, but filters not yet added to actual pages.
**Next Action**: Integrate filter components into projects and project detail pages.
