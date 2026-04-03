'use client';

import React, { useState } from 'react';
import { X, MessageSquare, Clock, User, Tag, AlertCircle, CheckCircle2, Edit2, Save, ChevronDown } from 'lucide-react';

interface TaskDetailPanelProps {
  task: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    assignee: string | null;
    dueDate: string;
    tags: string[];
    subtasks: { completed: number; total: number };
    comments: number;
    blockedReason?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (taskId: string, updates: any) => void;
}

/**
 * Task Detail Panel - PHASE 5
 * 
 * Right slide-over modal showing:
 * - Task title and description (editable)
 * - Metadata: priority, status, assignee, due date, tags
 * - Subtasks progress with expand/collapse
 * - Comments section with add comment
 * - Approval status (if applicable)
 * - Activity timeline showing recent changes
 * - Delete/Archive actions
 * 
 * Design: Token-based, smooth animations, keyboard shortcuts
 */
export default function TaskDetailPanel({
  task,
  isOpen,
  onClose,
  onUpdate,
}: TaskDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description);
  const [expandedSubtasks, setExpandedSubtasks] = useState(false);

  const handleSaveChanges = () => {
    onUpdate?.(task.id, {
      title: editedTitle,
      description: editedDescription,
    });
    setIsEditing(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return { bg: "bg-danger/10", text: "text-danger", badge: "bg-danger/20 border-danger/30" };
      case "medium":
        return { bg: "bg-warning/10", text: "text-warning", badge: "bg-warning/20 border-warning/30" };
      case "low":
        return { bg: "bg-info/10", text: "text-info", badge: "bg-info/20 border-info/30" };
      default:
        return { bg: "bg-surface", text: "text-secondary", badge: "bg-surface-alt border-border" };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DONE":
        return "bg-success/10 text-success border-success/20";
      case "IN_REVIEW":
        return "bg-warning/10 text-warning border-warning/20";
      case "IN_PROGRESS":
        return "bg-brand/10 text-brand border-brand/20";
      case "TODO":
        return "bg-info/10 text-info border-info/20";
      default:
        return "bg-surface text-secondary border-border";
    }
  };

  const priorityColor = getPriorityColor(task.priority);

  // Keyboard shortcut to close (Escape)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slide-over Panel */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-surface border-l border-border shadow-xl transform transition-transform duration-300 z-50 overflow-y-auto ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary">Task Details</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-alt rounded-lg transition-colors"
          >
            <X size={20} className="text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title Section */}
          <div>
            {isEditing ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full text-xl font-bold text-primary bg-surface-alt rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            ) : (
              <h1 className="text-xl font-bold text-primary break-words">{task.title}</h1>
            )}
          </div>

          {/* Priority & Status Badges */}
          <div className="flex gap-3 flex-wrap">
            <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border ${priorityColor.badge}`}>
              <span className={`text-xs font-semibold uppercase ${priorityColor.text}`}>
                {task.priority} priority
              </span>
            </div>
            <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border ${getStatusColor(task.status)}`}>
              <span className="text-xs font-semibold uppercase">{task.status.replace(/_/g, " ")}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">Description</label>
            {isEditing ? (
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="w-full h-24 text-sm text-primary bg-surface-alt rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
              />
            ) : (
              <p className="text-sm text-secondary leading-relaxed">{task.description}</p>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Metadata Grid */}
          <div className="space-y-4">
            {/* Due Date */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-secondary">
                <Clock size={16} />
                Due Date
              </label>
              <span className="text-sm text-primary bg-surface-alt px-3 py-1.5 rounded-lg">
                {new Date(task.dueDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>

            {/* Assignee */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-secondary">
                <User size={16} />
                Assignee
              </label>
              {task.assignee ? (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center text-xs font-semibold text-brand">
                    {task.assignee.charAt(0)}
                  </div>
                  <span className="text-sm text-primary">{task.assignee}</span>
                </div>
              ) : (
                <span className="text-sm text-tertiary italic">Unassigned</span>
              )}
            </div>

            {/* Tags */}
            {task.tags.length > 0 && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-secondary mb-2">
                  <Tag size={16} />
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-alt text-secondary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Subtasks Section */}
          <div>
            <button
              onClick={() => setExpandedSubtasks(!expandedSubtasks)}
              className="w-full flex items-center justify-between text-sm font-medium text-primary hover:bg-surface-alt px-3 py-2 rounded-lg transition-colors"
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} />
                Subtasks ({task.subtasks.completed}/{task.subtasks.total})
              </span>
              <ChevronDown
                size={16}
                className={`transition-transform ${expandedSubtasks ? "rotate-180" : ""}`}
              />
            </button>

            {expandedSubtasks && (
              <div className="mt-3 space-y-2">
                {/* Progress Bar */}
                <div className="px-3">
                  <div className="w-full bg-border rounded-full h-2 mb-2">
                    <div
                      className="h-2 rounded-full bg-success"
                      style={{
                        width: `${(task.subtasks.completed / task.subtasks.total) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-secondary">
                    {Math.round((task.subtasks.completed / task.subtasks.total) * 100)}% complete
                  </p>
                </div>

                {/* Mock Subtasks List */}
                <div className="space-y-2 px-3 mt-3">
                  {[...Array(task.subtasks.total)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={i < task.subtasks.completed}
                        readOnly
                        className="w-4 h-4 rounded border-border accent-success"
                      />
                      <span className={`text-sm ${i < task.subtasks.completed ? "text-tertiary line-through" : "text-secondary"}`}>
                        Subtask {i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Blocked Section */}
          {task.blockedReason && (
            <>
              <div className="p-3 bg-danger/5 border border-danger/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-danger flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-danger">Blocked</p>
                    <p className="text-xs text-danger mt-1">{task.blockedReason}</p>
                  </div>
                </div>
              </div>
              <div className="h-px bg-border" />
            </>
          )}

          {/* Comments Section */}
          <div>
            <button className="w-full flex items-center justify-between text-sm font-medium text-primary hover:bg-surface-alt px-3 py-2 rounded-lg transition-colors">
              <span className="flex items-center gap-2">
                <MessageSquare size={16} />
                Comments ({task.comments})
              </span>
              <ChevronDown size={16} />
            </button>

            <div className="mt-3 space-y-3">
              {/* Comment input */}
              <div>
                <textarea
                  placeholder="Add a comment..."
                  className="w-full text-sm text-primary bg-surface-alt rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none placeholder-tertiary"
                  rows={3}
                />
                <button className="mt-2 px-3 py-1.5 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors">
                  Add Comment
                </button>
              </div>

              {/* Mock comments */}
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-4 h-4 rounded-full bg-info/20 flex items-center justify-center text-xs font-semibold text-info">
                        {["S", "A"][i]}
                      </div>
                      <span className="font-medium text-secondary">
                        {["Sarah Chen", "Alex Rodriguez"][i]}
                      </span>
                      <span className="text-tertiary">2h ago</span>
                    </div>
                    <p className="text-secondary ml-6">Great progress on this. Let me know when you need review.</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-surface border-t border-border px-6 py-4 flex gap-3">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedTitle(task.title);
                  setEditedDescription(task.description);
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-secondary hover:bg-surface-alt rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors"
              >
                <Save size={16} />
                Save
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-secondary border border-border hover:bg-surface-alt rounded-lg transition-colors"
              >
                <Edit2 size={16} />
                Edit
              </button>
              <button className="flex-1 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/5 rounded-lg transition-colors">
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
