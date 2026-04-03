import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { Plus, Search, Filter, MoreVertical } from "lucide-react";

interface ProjectPageProps {
  params: {
    workspaceId: string;
    projectId: string;
  };
}

/**
 * Project Kanban Board - PHASE 5
 * 
 * 6-column kanban board showing:
 * - BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED
 * - Task cards with priority, assignee, due date, tags
 * - Drag-drop support (HTML5)
 * - Inline quick-add for tasks
 * - Design tokens throughout
 * 
 * Features:
 * - Column totals and task counts
 * - Expandable task detail preview
 * - Filter by assignee, label, priority
 * - Quick search within project
 * - Responsive: Full board on desktop, scrollable on mobile
 */
export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/login');
  }

  const { workspaceId, projectId } = params;

  // Validate workspace access
  const tenant = await resolveTenantContext(workspaceId, session.user.id);
  if (!tenant) {
    notFound();
  }

  // Mock project data
  const project = {
    id: projectId,
    title: "Mobile App Redesign",
    description: "Complete redesign of the mobile application UI/UX",
    created: new Date('2024-01-15'),
    owner: "Sarah Chen",
  };

  // Mock tasks by status
  const kanbanData = {
    BACKLOG: [
      {
        id: "task-1",
        title: "Implement dark mode for settings",
        description: "Add dark mode support to settings panel",
        priority: "medium",
        assignee: "Taylor Jones",
        dueDate: "2024-04-15",
        tags: ["feature", "ui"],
        subtasks: { completed: 0, total: 3 },
      },
      {
        id: "task-2",
        title: "Add offline sync capability",
        description: "Enable data sync when app goes offline",
        priority: "high",
        assignee: null,
        dueDate: "2024-05-01",
        tags: ["feature", "backend"],
        subtasks: { completed: 0, total: 5 },
      },
    ],
    TODO: [
      {
        id: "task-3",
        title: "Design login flow",
        description: "Create new login experience with biometric support",
        priority: "high",
        assignee: "Sarah Chen",
        dueDate: "2024-03-31",
        tags: ["design", "auth"],
        subtasks: { completed: 2, total: 4 },
      },
      {
        id: "task-4",
        title: "Update notification badges",
        description: "Redesign notification badge styling",
        priority: "low",
        assignee: "Alex Rodriguez",
        dueDate: "2024-04-20",
        tags: ["ui", "notification"],
        subtasks: { completed: 0, total: 2 },
      },
      {
        id: "task-5",
        title: "Create onboarding screens",
        description: "Design and develop app onboarding flow",
        priority: "high",
        assignee: "Jordan Kim",
        dueDate: "2024-04-10",
        tags: ["design", "onboarding"],
        subtasks: { completed: 1, total: 5 },
      },
    ],
    IN_PROGRESS: [
      {
        id: "task-6",
        title: "Refactor navigation component",
        description: "Improve navigation performance and accessibility",
        priority: "medium",
        assignee: "Sarah Chen",
        dueDate: "2024-03-28",
        tags: ["refactor", "performance"],
        subtasks: { completed: 3, total: 6 },
      },
      {
        id: "task-7",
        title: "Add haptic feedback",
        description: "Implement haptic feedback for user interactions",
        priority: "low",
        assignee: "Jordan Kim",
        dueDate: "2024-04-05",
        tags: ["feature"],
        subtasks: { completed: 1, total: 3 },
      },
    ],
    IN_REVIEW: [
      {
        id: "task-8",
        title: "Implement push notifications",
        description: "Add push notification system with Firebase",
        priority: "high",
        assignee: "Alex Rodriguez",
        dueDate: "2024-03-25",
        tags: ["feature", "backend"],
        subtasks: { completed: 4, total: 4 },
      },
    ],
    DONE: [
      {
        id: "task-9",
        title: "Setup project repository",
        description: "Initialize repo and CI/CD pipeline",
        priority: "high",
        assignee: "Sarah Chen",
        dueDate: "2024-01-20",
        tags: ["infrastructure"],
        subtasks: { completed: 3, total: 3 },
      },
      {
        id: "task-10",
        title: "Create design system",
        description: "Build component library and design tokens",
        priority: "high",
        assignee: "Jordan Kim",
        dueDate: "2024-02-15",
        tags: ["design", "foundation"],
        subtasks: { completed: 5, total: 5 },
      },
      {
        id: "task-11",
        title: "Setup analytics tracking",
        description: "Implement event tracking and analytics",
        priority: "medium",
        assignee: "Alex Rodriguez",
        dueDate: "2024-02-28",
        tags: ["analytics"],
        subtasks: { completed: 2, total: 2 },
      },
    ],
    BLOCKED: [
      {
        id: "task-12",
        title: "Integrate payment gateway",
        description: "Add Stripe payment processing",
        priority: "high",
        assignee: "Taylor Jones",
        dueDate: "2024-04-30",
        tags: ["feature", "payment"],
        subtasks: { completed: 0, total: 4 },
        blockedReason: "Awaiting legal review of payment terms",
      },
    ],
  };

  const columns = [
    { key: "BACKLOG", label: "Backlog", color: "text-secondary" },
    { key: "TODO", label: "To Do", color: "text-info" },
    { key: "IN_PROGRESS", label: "In Progress", color: "text-brand" },
    { key: "IN_REVIEW", label: "In Review", color: "text-warning" },
    { key: "DONE", label: "Done", color: "text-success" },
    { key: "BLOCKED", label: "Blocked", color: "text-danger" },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-danger/10 text-danger";
      case "medium":
        return "bg-warning/10 text-warning";
      case "low":
        return "bg-info/10 text-info";
      default:
        return "bg-surface text-secondary";
    }
  };

  const TaskCard = ({ task }: { task: any }) => {
    const isOverdue = new Date(task.dueDate) < new Date() && !["DONE", "BLOCKED"].includes("DONE");
    const priorityLeftBorderColor = {
      high: '#DC2626',
      medium: '#1A5CDB',
      low: '#8FAACC',
    } as Record<string, string>;
    
    return (
      <div
        draggable
        className="rounded-md border border-border bg-surface-raised p-3 hover:shadow-md hover:border-border-strong transition-all cursor-move group overflow-hidden"
        style={{
          borderLeft: `2px solid ${priorityLeftBorderColor[task.priority] || '#8FAACC'}`
        }}
      >
        {/* Task Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-medium text-text-primary flex-1 group-hover:text-brand transition-colors">
            {task.title}
          </h3>
          <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-surface-alt rounded transition-opacity">
            <MoreVertical size={16} className="text-text-secondary" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-muted mb-2 line-clamp-2">{task.description}</p>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {task.tags.map((tag: string) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Subtasks Progress */}
        {task.subtasks.total > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted">
                {task.subtasks.completed}/{task.subtasks.total}
              </span>
            </div>
            <div className="w-full bg-border rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-success"
                style={{
                  width: `${(task.subtasks.completed / task.subtasks.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Footer: Priority Badge, Assignee, Due Date */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            task.priority === 'high' ? 'bg-danger/10 text-danger' :
            task.priority === 'medium' ? 'bg-info/10 text-info' :
            'bg-muted/10 text-muted'
          }`}>
            {task.priority}
          </span>
          {task.assignee && (
            <div className="w-5 h-5 rounded-full bg-brand/20 flex items-center justify-center text-xs font-semibold text-brand">
              {task.assignee.charAt(0)}
            </div>
          )}
        </div>

        {/* Due Date */}
        {task.dueDate && (
          <div className={`mt-2 text-xs ${isOverdue ? 'text-danger font-medium' : 'text-text-muted'}`}>
            📅 {new Date(task.dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </div>
        )}

        {/* Blocked Reason */}
        {task.blockedReason && (
          <div className="mt-2 p-2 bg-danger/5 border border-danger/20 rounded text-xs text-danger">
            🚫 {task.blockedReason}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">{project.title}</h1>
          <p className="text-secondary text-sm mt-1">{project.description}</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white hover:bg-brand-dark transition-colors font-medium text-sm">
          <Plus size={18} />
          New Task
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
          <input
            type="text"
            placeholder="Search tasks..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all"
          />
        </div>
        <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-surface-alt transition-colors">
          <Filter size={16} className="text-secondary" />
          Filter
        </button>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4 -mx-6 px-6">
        <div className="grid grid-cols-6 gap-4 min-w-max">
          {columns.map((column) => (
            <div
              key={column.key}
              className="w-80 shrink-0 rounded-lg border border-border bg-surface-alt/50 overflow-hidden"
            >
              {/* Column Header with Top Color */}
              <div className={`h-1 w-full ${
                column.key === 'BACKLOG' ? 'bg-text-muted' :
                column.key === 'TODO' ? 'bg-info' :
                column.key === 'IN_PROGRESS' ? 'bg-warning' :
                column.key === 'IN_REVIEW' ? 'bg-warning' :
                column.key === 'DONE' ? 'bg-success' :
                'bg-danger'
              }`} />
              
              <div className="p-4">
                <h2 className={`font-semibold text-sm ${column.color}`}>{column.label}</h2>
                <p className="text-xs text-muted mt-1">
                  {(kanbanData as any)[column.key].length} tasks
                </p>
              </div>

              {/* Tasks List */}
              <div className="space-y-3 p-4 pt-0 min-h-[200px]">
                {(kanbanData as any)[column.key].map((task: any) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>

              {/* Add Task Button */}
              <div className="px-4 pb-4">
                <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-dashed border-border hover:border-brand hover:bg-brand/5 text-text-secondary hover:text-brand transition-colors text-sm font-medium">
                  <Plus size={16} />
                  Add task
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="rounded-lg border border-border bg-surface p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">
            {Object.values(kanbanData).flat().length}
          </p>
          <p className="text-xs text-secondary">Total Tasks</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-info">{(kanbanData as any)["TODO"].length}</p>
          <p className="text-xs text-secondary">To Do</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-brand">{(kanbanData as any)["IN_PROGRESS"].length}</p>
          <p className="text-xs text-secondary">In Progress</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-warning">{(kanbanData as any)["IN_REVIEW"].length}</p>
          <p className="text-xs text-secondary">In Review</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-success">{(kanbanData as any)["DONE"].length}</p>
          <p className="text-xs text-secondary">Done</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-danger">{(kanbanData as any)["BLOCKED"].length}</p>
          <p className="text-xs text-secondary">Blocked</p>
        </div>
      </div>
    </div>
  );
}
