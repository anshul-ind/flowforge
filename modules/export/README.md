# Task Export Module

Complete guide for exporting project tasks with comments, reactions, and mentions to CSV format.

## Overview

The task export module provides comprehensive data export functionality for projects, including:
- Task details (title, description, status, priority, etc.)
- Comments and comment metadata
- Reactions (emoji) on comments with user counts
- Mentions in comments
- Assignee information
- Multiple export formats

## Installation & Setup

The export module is already integrated and requires no additional setup.

## API Usage

### Export Project Tasks to CSV

**Endpoint:** `GET /api/exports/projects/[projectId]`

**Required Parameters:**
- `projectId` (path) - The ID of the project to export
- `workspaceId` (query) - The ID of the workspace (for authorization)

**Optional Parameters:**
- `format` (query) - Export format: `csv` (default) or `detailed`

### Example Requests

#### Standard CSV Format
```bash
curl "http://localhost:3000/api/exports/projects/proj_123?workspaceId=ws_456" \
  -H "Cookie: [session-cookie]"
```

This exports tasks in a compact format with comments embedded in a single cell.

#### Detailed CSV Format
```bash
curl "http://localhost:3000/api/exports/projects/proj_123?workspaceId=ws_456&format=detailed" \
  -H "Cookie: [session-cookie]"
```

This exports tasks in a detailed format with one row per comment, allowing for easier analysis in spreadsheet applications.

### Response

**Success (200):**
- Returns CSV file as attachment
- Filename: `tasks-[projectId]-[YYYY-MM-DD].csv`
- Content-Type: `text/csv; charset=utf-8`

**Errors:**
- `400` - Missing required parameters
- `401` - Not authenticated
- `403` - No access to workspace
- `404` - No tasks found in project
- `500` - Server error

## CSV Format Specifications

### Standard Format Columns

| Column | Description |
|--------|-------------|
| Task ID | Unique identifier for the task |
| Title | Task title |
| Description | Task description (if any) |
| Status | Task status (BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED) |
| Priority | Task priority (LOW, MEDIUM, HIGH, URGENT) |
| Due Date | ISO 8601 date/time or empty |
| Created At | ISO 8601 date/time of task creation |
| Updated At | ISO 8601 date/time of last update |
| Assignee | Assigned user name and email, or empty |
| Project | Project name |
| Comment Count | Number of comments on task |
| Comments | All comments with metadata (embedded in cell) |

### Detailed Format Columns

| Column | Description |
|--------|-------------|
| Task ID | Unique identifier for the task |
| Title | Task title |
| Description | Task description |
| Status | Task status |
| Priority | Task priority |
| Due Date | Due date (if any) |
| Created At | Task creation timestamp |
| Updated At | Last task update timestamp |
| Assignee | Assigned user (if any) |
| Project | Project name |
| Comment ID | Comment unique ID (empty if no comments) |
| Comment Author | Comment author name and email |
| Comment Content | Comment text content |
| Comment Created At | Comment creation timestamp |
| Comment Reactions | Reactions in format: emoji(count), emoji(count), ... |
| Comment Mentions | Mentioned users in format: name (email), name (email), ... |

## Examples

### JavaScript/Node.js

```typescript
// Browser environment
async function exportTasks(projectId: string, workspaceId: string) {
  const response = await fetch(
    `/api/exports/projects/${projectId}?workspaceId=${workspaceId}&format=detailed`
  );

  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }

  // Download file
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tasks-${projectId}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
}
```

### React Component

```tsx
import { useState } from 'react';

export function ExportButton({ projectId, workspaceId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (format: 'csv' | 'detailed') => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/exports/projects/${projectId}?workspaceId=${workspaceId}&format=${format}`
      );

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const filename = response.headers
        .get('content-disposition')
        ?.split('filename="')[1]
        ?.split('"')[0];

      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `export.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={() => handleExport('csv')}
        disabled={loading}
      >
        {loading ? 'Exporting...' : 'Export (Compact)'}
      </button>
      <button
        onClick={() => handleExport('detailed')}
        disabled={loading}
      >
        {loading ? 'Exporting...' : 'Export (Detailed)'}
      </button>
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
```

## Data Structure

### TaskExportData Interface

```typescript
interface TaskExportData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  assignee: string | null;              // "Name (email@example.com)" or null
  projectName: string;
  commentCount: number;
  comments: Array<{
    id: string;
    content: string;
    author: string;                     // "Name (email@example.com)"
    createdAt: string;
    editedAt: string | null;
    deletedAt: string | null;
    reactions: Array<{
      emoji: string;
      userCount: number;
    }>;
    mentions: string[];                 // ["Name (email)", "Name (email)"]
  }>;
}
```

## Service Classes

### ExportService

Main service for export operations with authorization checks.

```typescript
export class ExportService {
  // Export to compact CSV format
  async exportProjectTasksToCSV(projectId: string): Promise<string>;

  // Export to detailed CSV format (comments on separate rows)
  async exportProjectTasksToDetailedCSV(projectId: string): Promise<string>;

  // Get raw task export data
  async getProjectTasksForExport(projectId: string): Promise<TaskExportData[]>;
}
```

### ExportRepository

Data access layer for export operations.

```typescript
export class ExportRepository {
  // Fetch all tasks in a project with complete relations
  async getProjectTasksForExport(projectId: string): Promise<TaskExportData[]>;
}
```

## CSV Utilities

Located in `lib/utils/csv.ts`

```typescript
// Convert tasks to compact CSV
export function convertTasksToCSV(tasks: TaskExportData[]): string;

// Convert tasks to detailed CSV (comments on separate rows)
export function convertTasksToDetailedCSV(tasks: TaskExportData[]): string;
```

## Security & Authorization

- ✅ User must be authenticated
- ✅ User must be a member of the workspace
- ✅ User can only export projects in their workspace
- ✅ Workspace boundaries enforced at repository level
- ✅ No sensitive user data exposed (only name and email)

## Limitations

- Currently exports tasks from a single project
- Workspace membership required for access
- No task dependencies export (can be added in future versions)
- Comment edit history not included

## Future Enhancements

- [ ] Export multiple projects at once
- [ ] Filter by task status, priority, assignee
- [ ] Include task dependencies
- [ ] Export to JSON/Excel formats
- [ ] Include attachment URLs
- [ ] Schedule automated exports
- [ ] Export email notifications history
- [ ] Include approval request history
