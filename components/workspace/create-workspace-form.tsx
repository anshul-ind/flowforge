'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createWorkspaceAction } from '@/modules/workspace/create-action';
import { ActionResult } from '@/types/action-result';
import { Workspace } from '@/lib/generated/prisma';

/**
 * Create Workspace Form
 * 
 * Client component for creating a new workspace.
 * 
 * Features:
 * - Form field validation feedback
 * - Loading state during submission
 * - Success redirect to workspace
 * - Error messaging
 * 
 * Props: None
 * 
 * Usage:
 * <CreateWorkspaceForm />
 */
export function CreateWorkspaceForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(formData: FormData) {
    try {
      setIsLoading(true);
      setError(null);
      setFieldErrors({});

      const input = {
        name: formData.get('name'),
      };

      const result: ActionResult<Workspace> = await createWorkspaceAction(input);

      if (!result.success) {
        setError(result.message || 'Failed to create workspace');
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      // Success - redirect to workspace
      router.push(`/workspace/${result.data?.id}`);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Workspace Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          placeholder="My Workspace"
          required
          disabled={isLoading}
          className={`mt-1 block w-full rounded-md border ${
            fieldErrors.name ? 'border-red-500' : 'border-gray-300'
          } px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100`}
        />
        {fieldErrors.name && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.name[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isLoading ? 'Creating...' : 'Create Workspace'}
      </button>
    </form>
  );
}
