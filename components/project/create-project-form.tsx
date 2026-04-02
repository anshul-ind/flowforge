'use client';

import { useState, useRef } from 'react';
import { createProjectAction } from '@/modules/project/project-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CreateProjectFormProps {
  workspaceId: string;
  onSuccess?: () => void;
}

export function CreateProjectForm({
  workspaceId,
  onSuccess,
}: CreateProjectFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setMessage('');

    try {
      console.log('[CreateProjectForm] Submitting form for workspace:', workspaceId);
      const formData = new FormData(e.currentTarget);
      
      // Log form data
      const name = formData.get('name');
      const description = formData.get('description');
      const dueDate = formData.get('dueDate');
      console.log('[CreateProjectForm] Form data:', { name, description, dueDate });

      const result = await createProjectAction(workspaceId, formData);
      console.log('[CreateProjectForm] Action result:', result);

      if (result.success) {
        console.log('[CreateProjectForm] SUCCESS - Project created:', result.data);
        setMessage(result.message || 'Project created successfully!');
        setErrors({});
        // Use formRef instead of e.currentTarget to avoid null reference
        if (formRef.current) {
          formRef.current.reset();
        }
        setTimeout(() => {
          setIsOpen(false);
          onSuccess?.();
        }, 500);
      } else {
        console.log('[CreateProjectForm] ERROR - Validation failed:', result);
        setErrors(result.fieldErrors || {});
        const errorMsg = result.formError || result.message || 'Failed to create project';
        console.error('[CreateProjectForm] Error message:', errorMsg);
        setMessage(errorMsg);
      }
    } catch (err) {
      console.error('[CreateProjectForm] Caught exception:', err);
      if (err instanceof Error) {
        setMessage(`Error: ${err.message}`);
      } else {
        setMessage('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="bg-blue-600 text-white hover:bg-blue-700">
        + New Project
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Create New Project</h2>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Project Name *
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="e.g., Q2 Product Release"
              required
              disabled={isLoading}
              className="mt-1"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Project description..."
              disabled={isLoading}
              rows={3}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description[0]}</p>}
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
              Due Date
            </label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              disabled={isLoading}
              className="mt-1"
            />
            {errors.dueDate && <p className="mt-1 text-sm text-red-600">{errors.dueDate[0]}</p>}
          </div>

          {message && (
            <div className={`p-4 rounded-md text-sm border ${
              message.includes('successfully') || message.includes('SUCCESS')
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <div className="font-medium">{message.includes('successfully') ? '✓ Success' : '✗ Error'}</div>
              <p className="text-xs mt-1 font-mono whitespace-pre-wrap break-words">{message}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
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
              {isLoading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
