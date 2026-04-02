'use client';

import { useState, useRef } from 'react';
import { createTaskAction } from '@/modules/task/create-task-action';
import { updateTaskAction } from '@/modules/task/update-task-action';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Task, TaskPriority } from '@/lib/generated/prisma';

interface TaskFormProps {
  workspaceId: string;
  projectId: string;
  task?: Task | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: 'bg-gray-100 text-gray-700' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-700' },
];

export function TaskForm({
  workspaceId,
  projectId,
  task,
  onSuccess,
  onCancel,
  isOpen = true,
  onOpenChange,
}: TaskFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const isEditing = !!task;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setMessage('');

    try {
      const formData = new FormData(e.currentTarget);
      
      let result;
      if (isEditing) {
        result = await updateTaskAction(workspaceId, projectId, task!.id, formData);
      } else {
        result = await createTaskAction(workspaceId, projectId, formData);
      }

      if (result.success) {
        setMessage(result.message || 'Task saved successfully!');
        setErrors({});
        // Use formRef instead of e.currentTarget to avoid null reference
        if (formRef.current) {
          formRef.current.reset();
        }
        setTimeout(() => {
          onOpenChange?.(false);
          onSuccess?.();
        }, 500);
      } else {
        setErrors(result.fieldErrors || {});
        setMessage(result.formError || result.message || 'Failed to save task');
      }
    } catch (err) {
      console.error('[TaskForm] Caught exception:', err);
      setMessage(err instanceof Error ? `Error: ${err.message}` : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">{isEditing ? 'Edit Task' : 'Create Task'}</h2>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Task Title *
            </label>
            <Input
              id="title"
              name="title"
              type="text"
              placeholder="Task title..."
              defaultValue={task?.title || ''}
              required
              disabled={isLoading}
              className="mt-1"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title[0]}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description (Markdown supported)
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Add detailed description..."
              defaultValue={task?.description || ''}
              disabled={isLoading}
              rows={4}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description[0]}</p>}
          </div>

          {/* Priority & Status - Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                defaultValue={task?.priority || 'MEDIUM'}
                disabled={isLoading}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {PRIORITIES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Estimated Hours */}
            <div>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
              Due Date
            </label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              defaultValue={task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
              disabled={isLoading}
              className="mt-1"
            />
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
              Tags (comma-separated)
            </label>
            <Input
              id="tags"
              name="tags"
              type="text"
              placeholder="e.g., urgent, frontend, bug"
              disabled={isLoading}
              className="mt-1"
            />
          </div>

          {/* Error/Success Message */}
          {message && (
            <div className={`p-4 rounded-md text-sm border ${
              message.includes('successfully')
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {message}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                onOpenChange?.(false);
                onCancel?.();
              }}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : (isEditing ? 'Update Task' : 'Create Task')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
