'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Task, TaskPriority, TaskStatus } from '@/lib/generated/prisma';
import { TaskForm } from './task-form';

interface TaskListProps {
  tasks: Task[];
  workspaceId: string;
  projectId: string;
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  BACKLOG: 'bg-gray-100 text-gray-700',
  TODO: 'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  IN_REVIEW: 'bg-purple-100 text-purple-700',
  DONE: 'bg-green-100 text-green-700',
  BLOCKED: 'bg-red-100 text-red-700',
};

export function TaskList({  tasks,
  workspaceId,
  projectId,
}: TaskListProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">No tasks yet</h3>
        <p className="text-gray-500 mt-2">Create your first task to get started</p>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Task
        </button>
        <TaskForm
          workspaceId={workspaceId}
          projectId={projectId}
          isOpen={isCreateOpen}
          onOpenChange={setIsCreateOpen}
        />
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Priority</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Due Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Est. Hours</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr
                key={task.id}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedTask(task)}
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/workspace/${workspaceId}/project/${projectId}/task/${task.id}`}
                    className="text-blue-600 hover:underline font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {task.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
                    {task.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[task.status]}`}>
                    {task.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit task modal */}
      {selectedTask && (
        <TaskForm
          workspaceId={workspaceId}
          projectId={projectId}
          task={selectedTask}
          isOpen={true}
          onOpenChange={(open) => {
            if (!open) setSelectedTask(null);
          }}
        />
      )}

      {/* Create task modal */}
      <TaskForm
        workspaceId={workspaceId}
        projectId={projectId}
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </>
  );
}
