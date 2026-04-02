# Phase 10: Search & Filtering - Integration Examples

This file provides practical examples for integrating the search and filtering components into your pages.

## 1. Command Palette (Already Integrated Globally)

The command palette is automatically available on all workspace pages because it's included in the workspace layout.

**Already in place at**: `app/workspace/[workspaceId]/layout.tsx`

No additional integration needed! Just press Cmd+K anywhere.

---

## 2. Search Results Page

The search page is already created at `/workspace/[workspaceId]/search`

**If you want to create a link to search**:
```tsx
import Link from 'next/link';

export function SearchLink() {
  return (
    <Link href="/workspace/abc123/search?q=budget">
      Look for budget items
    </Link>
  );
}
```

**If you want to redirect to search from a form**:
```tsx
'use client';

import { useRouter } from 'next/navigation';

export function SearchForm({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();

  const handleSearch = (query: string) => {
    const encoded = encodeURIComponent(query);
    router.push(`/workspace/${workspaceId}/search?q=${encoded}`);
  };

  return (
    <input
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          handleSearch(e.currentTarget.value);
        }
      }}
      placeholder="Search..."
    />
  );
}
```

---

## 3. Task Listing Page with Filters

Example of integrating task filters into a task listing page:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { TaskFilterBar, type TaskFilters } from '@/components/search';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  projectId: string;
}

export default function TasksListPage({ workspaceId }: { workspaceId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch tasks when filters change
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);

      // Build query parameters from filters
      const params = new URLSearchParams();
      if (filters.status?.length) {
        params.append('status', filters.status[0]); // Or join with comma for multi
      }
      if (filters.priority?.length) {
        params.append('priority', filters.priority[0]);
      }
      if (filters.dueDate) {
        params.append('dueDate', filters.dueDate);
      }

      try {
        const res = await fetch(
          `/api/workspace/${workspaceId}/tasks?${params.toString()}`
        );
        if (res.ok) {
          const data = await res.json();
          setTasks(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [filters, workspaceId]);

  return (
    <div>
      <h1>Tasks</h1>
      
      {/* Add the filter bar */}
      <TaskFilterBar 
        onFiltersChange={setFilters}
        isLoading={isLoading}
      />

      {/* Task list */}
      <div className="mt-6">
        {tasks.length === 0 ? (
          <p className="text-gray-500">No tasks found</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map(task => (
              <li key={task.id} className="p-4 border rounded">
                <h3 className="font-semibold">{task.title}</h3>
                <p className="text-sm text-gray-500">
                  {task.status} • {task.priority}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
```

---

## 4. Project Listing Page with Filters

Example of integrating project filters into a project listing page:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { ProjectFilterBar, type ProjectFilters } from '@/components/search';

interface ProjectMember {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
  createdAt: Date;
  description?: string;
}

export default function ProjectsListPage({ workspaceId }: { workspaceId: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [filters, setFilters] = useState<ProjectFilters>({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch members for filter options
  useEffect(() => {
    const fetchMembers = async () => {
      const res = await fetch(`/api/workspace/${workspaceId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.data);
      }
    };

    fetchMembers();
  }, [workspaceId]);

  // Fetch projects when filters change
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);

      const params = new URLSearchParams();
      if (filters.status?.length) {
        params.append('status', filters.status[0]);
      }
      if (filters.member?.length) {
        filters.member.forEach(m => params.append('member', m));
      }
      if (filters.createdAfter) {
        params.append('createdAfter', filters.createdAfter);
      }
      if (filters.createdBefore) {
        params.append('createdBefore', filters.createdBefore);
      }

      try {
        const res = await fetch(
          `/api/workspace/${workspaceId}/projects?${params.toString()}`
        );
        if (res.ok) {
          const data = await res.json();
          setProjects(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [filters, workspaceId]);

  return (
    <div>
      <h1>Projects</h1>
      
      {/* Add the filter bar with members */}
      <ProjectFilterBar 
        onFiltersChange={setFilters}
        memberOptions={members}
        isLoading={isLoading}
      />

      {/* Project grid */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.length === 0 ? (
          <p className="text-gray-500 col-span-full">No projects found</p>
        ) : (
          projects.map(project => (
            <div key={project.id} className="p-4 border rounded">
              <h3 className="font-semibold text-lg">{project.name}</h3>
              {project.description && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {project.description}
                </p>
              )}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {project.status}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

---

## 5. Dashboard with Quick Search

Example of a dashboard component with quick project/task search:

```tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  name?: string;
  title?: string;
  type: 'project' | 'task';
}

export function DashboardQuickSearch({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      const res = await fetch(
        `/api/workspace/${workspaceId}/search?q=${encodeURIComponent(query)}&limit=5`
      );

      if (res.ok) {
        const data = await res.json();
        const combined = [
          ...data.data.projects.map((p: any) => ({ ...p, type: 'project' })),
          ...data.data.tasks.map((t: any) => ({ ...t, type: 'task' })),
        ];
        setResults(combined.slice(0, 5));
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, workspaceId]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push(`/workspace/${workspaceId}/search?q=${encodeURIComponent(query)}`);
    setShowResults(false);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Quick search..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </form>

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg z-10">
          {results.map(result => (
            <Link
              key={`${result.type}-${result.id}`}
              href={
                result.type === 'project'
                  ? `/workspace/${workspaceId}/project/${result.id}`
                  : `/workspace/${workspaceId}/project/${result.id}/tasks`
              }
              className="block px-4 py-2 hover:bg-gray-100 text-sm"
            >
              <span className="font-medium">{result.name || result.title}</span>
              <span className="text-gray-500 ml-2 text-xs">
                {result.type === 'project' ? 'Project' : 'Task'}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 6. Sidebar Search Integration

If you want to add a search component to your sidebar:

```tsx
'use client';

import { useRouter } from 'next/navigation';

export function SidebarSearch({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('q') as string;
    router.push(`/workspace/${workspaceId}/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <input
        type="text"
        name="q"
        placeholder="Search or press Cmd+K"
        className="w-full px-3 py-2 border rounded text-sm"
      />
    </form>
  );
}
```

---

## 7. Advanced: Custom Task Filter Implementation

If you need custom task filtering beyond what TaskFilterBar provides:

```tsx
'use client';

import { SearchService } from '@/modules/search/service';
import { useEffect, useState } from 'react';

interface CustomTaskFilters {
  query?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  projectId?: string;
  dueBefore?: string;
  dueAfter?: string;
  page?: number;
}

export function useAdvancedTaskSearch(
  workspaceId: string,
  filters: CustomTaskFilters
) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);

      const params = new URLSearchParams();
      if (filters.query) params.append('query', filters.query);
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.assigneeId) params.append('assigneeId', filters.assigneeId);
      if (filters.projectId) params.append('projectId', filters.projectId);
      if (filters.dueBefore) params.append('dueBefore', filters.dueBefore);
      if (filters.dueAfter) params.append('dueAfter', filters.dueAfter);
      if (filters.page) params.append('page', String(filters.page));

      try {
        const res = await fetch(
          `/api/workspace/${workspaceId}/tasks/search?${params.toString()}`
        );
        if (res.ok) {
          const data = await res.json();
          setTasks(data.data);
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [filters, workspaceId]);

  return { tasks, loading };
}
```

---

## Summary of Components to Use

| Page Type | Component | Import |
|-----------|-----------|--------|
| Any page | Command Palette | Already included in layout |
| Search Results | SearchResultsComponent | See `/workspace/[workspaceId]/search` |
| Task Listing | TaskFilterBar | `import { TaskFilterBar } from '@/components/search'` |
| Project Listing | ProjectFilterBar | `import { ProjectFilterBar } from '@/components/search'` |

---

**Last Updated**: Phase 10
**Status**: Integration Examples Ready
