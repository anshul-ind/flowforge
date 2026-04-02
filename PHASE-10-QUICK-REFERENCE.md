# Phase 10: Global Search & Filtering - Quick Reference Guide

## Quick Start

### 1. Command Palette (Cmd+K)
**Keyboard shortcut**: `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)

Features:
- Opens a search overlay on any workspace page
- Type to search for projects or tasks
- Results appear instantly with 300ms debounce
- Navigate with arrow keys (↑↓)
- Press Enter to jump to a result
- Press Escape to close

**Example**:
1. Press Cmd+K anywhere in the workspace
2. Type "Design"
3. See projects and tasks matching "Design"
4. Use arrow keys to select
5. Press Enter to navigate to the selected item

---

### 2. Search Page
**URL**: `/workspace/{workspaceId}/search?q={query}`

Access:
- Direct URL navigation
- Forms that link to search page
- Command palette results

Features:
- Full search results with tab filtering
- Shows projects and tasks separately
- Results count
- Links to individual items

**Example**:
```
/workspace/abc123/search?q=budget
```

---

### 3. Task Filter Bar
Used on task listing pages to filter by:

**Filters**:
- Status: OPEN, IN_PROGRESS, REVIEW, DONE
- Priority: LOW, MEDIUM, HIGH, URGENT
- Due Date: Today, This Week, This Month, Overdue

**Usage Pattern** (for page developers):
```tsx
import { TaskFilterBar, type TaskFilters } from '@/components/search';

export default function TasksPage() {
  const [filters, setFilters] = useState<TaskFilters>({});

  const handleFiltersChange = (newFilters: TaskFilters) => {
    setFilters(newFilters);
    // Call API with filters: /api/search/tasks?status=OPEN&priority=HIGH
  };

  return (
    <>
      <TaskFilterBar onFiltersChange={handleFiltersChange} />
      {/* Render filtered task list */}
    </>
  );
}
```

---

### 4. Project Filter Bar
Used on project listing pages to filter by:

**Filters**:
- Status: PLANNING, ACTIVE, PAUSED, COMPLETED, ARCHIVED
- Team Members: Dynamic list with checkboxes
- Date Range: Created After / Before (date pickers)

**Usage Pattern** (for page developers):
```tsx
import { ProjectFilterBar, type ProjectFilters } from '@/components/search';

export default function ProjectsPage() {
  const [filters, setFilters] = useState<ProjectFilters>({});
  const [members, setMembers] = useState([
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
  ]);

  const handleFiltersChange = (newFilters: ProjectFilters) => {
    setFilters(newFilters);
    // Call API with filters
  };

  return (
    <>
      <ProjectFilterBar 
        onFiltersChange={handleFiltersChange}
        memberOptions={members}
      />
      {/* Render filtered project list */}
    </>
  );
}
```

---

## API Usage

### Global Search Endpoint
```
GET /api/workspace/[workspaceId]/search?q={query}&limit={limit}
```

**Parameters**:
- `q` (required): Search query string (1-100 characters)
- `limit` (optional): Max results to return (1-50, default: 20)

**Response**:
```json
{
  "data": {
    "projects": [
      {
        "id": "proj-123",
        "name": "Website Redesign",
        "description": "...",
        "status": "ACTIVE"
      }
    ],
    "tasks": [
      {
        "id": "task-456",
        "title": "Design Homepage",
        "status": "IN_PROGRESS",
        "priority": "HIGH",
        "projectId": "proj-123",
        "project": { "name": "Website Redesign" }
      }
    ]
  },
  "query": "design"
}
```

---

## Component File Locations

```
components/
└── search/
    ├── command-palette.tsx          # Main Cmd+K overlay
    ├── command-palette-provider.tsx # Client wrapper
    ├── search-results.tsx           # Full search page
    ├── task-filter-bar.tsx          # Task filters
    ├── project-filter-bar.tsx       # Project filters
    └── index.ts                     # Public exports

app/
└── workspace/
    ├── [workspaceId]/
    │   ├── layout.tsx               # CommandPaletteProvider added
    │   └── search/
    │       └── page.tsx             # Search results page

modules/
└── search/
    └── service.ts                   # SearchService with all search logic

lib/
└── ... (existing utilities)
```

---

## Testing Checklist

### Command Palette
- [ ] Press Cmd+K / Ctrl+K to open
- [ ] Search for a project by name
- [ ] Search for a task by title
- [ ] Use arrow keys to navigate results
- [ ] Press Enter to navigate to result
- [ ] Press Escape to close
- [ ] Type empty query and verify empty state
- [ ] Verify debounce (no excessive requests)

### Search Page
- [ ] Navigate to `/workspace/{id}/search?q=test`
- [ ] Verify results load from query parameter
- [ ] Click "Projects" tab - shows only projects
- [ ] Click "Tasks" tab - shows only tasks
- [ ] Click "All Results" tab - shows both
- [ ] Verify result count matches tab titles
- [ ] Click on a project result - navigates correctly
- [ ] Click on a task result - navigates correctly

### Task Filter Bar
- [ ] Click "Show filters" to expand
- [ ] Click a status button - it highlights (blue)
- [ ] Click priority buttons - they highlight
- [ ] Select "Due Today" - filter button appears
- [ ] Click "Clear all filters" - all filters reset
- [ ] Verify collapsed view shows active filters
- [ ] Click X on a filter chip - removes that filter

### Project Filter Bar
- [ ] Click "Show filters" to expand
- [ ] Click status buttons - they highlight
- [ ] Select team members - they highlight
- [ ] Set date range with date pickers
- [ ] Click "Clear all filters" - all reset
- [ ] Verify collapsed view shows active filters

---

## Keyboard Shortcuts Reference

| Shortcut | Action |
|----------|--------|
| Cmd+K / Ctrl+K | Open command palette |
| ↓ Arrow | Next result |
| ↑ Arrow | Previous result |
| Enter | Select result / Navigate |
| Escape | Close command palette |

---

## Performance Notes

1. **Search Debounce**: 300ms to reduce API calls during typing
2. **Result Limit**: Default 20, max 50 results per query
3. **Pagination**: Use pagination param in SearchService for large result sets
4. **Caching**: Results aren't cached; refetch on each new query

---

## Type Definitions

### TaskFilters
```typescript
interface TaskFilters {
  status?: string[];           // Multiple status values
  priority?: string[];         // Multiple priority values
  assignee?: string[];         // Multiple assignee IDs
  dueDate?: 'today' | 'week' | 'month' | 'overdue';
}
```

### ProjectFilters
```typescript
interface ProjectFilters {
  status?: string[];           // Multiple status values
  member?: string[];           // Multiple member IDs
  createdAfter?: string;       // ISO date string
  createdBefore?: string;      // ISO date string
}
```

---

## Styling & Customization

### Color Scheme
- Primary: `text-blue-600`, `bg-blue-600`
- Success: `bg-green-50`, `text-green-700`
- Warning: `bg-orange-100`, `text-orange-700`
- Danger: `bg-red-100`, `text-red-700`

### CSS Classes
All components use Tailwind CSS utility classes. To customize:
1. Components are not styled with inline CSS
2. Modify `className` attributes directly in component files
3. Follow Tailwind's utility-first approach

---

## Troubleshooting

### "Module not found: lucide-react"
✅ **Fixed**: Replaced with Unicode symbols (✕)

### Command Palette not appearing
- Check if keyboard shortcut is working (browser DevTools)
- Verify `CommandPaletteProvider` is in workspace layout
- Check browser console for JavaScript errors

### Search results are empty
- Verify project/task exists in workspace
- Check that search query matches part of name/description
- Confirm user has access to workspace

### Filters not updating
- Verify `onFiltersChange` callback is connected to state
- Check that filter state updates are triggering API calls
- Monitor network tab for API requests

---

## Future Enhancements

1. **Recent Searches**: Show last 5 searches in command palette
2. **Saved Filters**: Save and load filter presets
3. **Search Analytics**: Track popular searches
4. **Advanced Query**: Support AND/OR operators in search
5. **Filter Presets**: Quick buttons for "My Tasks", "High Priority", etc.
6. **Elastic Search**: Full-text search for better matching

---

**Last Updated**: Phase 10
**Status**: Ready for Testing & Integration
