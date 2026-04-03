'use client'

import { useActionState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createProjectAction } from '@/app/workspace/[workspaceId]/actions'
import { Card } from '@/components/layout/page-components'
import { cn } from '@/lib/utils'

interface CreateProjectFormProps {
  workspaceId: string
}

export function CreateProjectForm({ workspaceId }: CreateProjectFormProps) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await createProjectAction(workspaceId, formData)
      
      if (result.success) {
        router.push(
          `/workspace/${workspaceId}/projects/${result.projectId}`
        )
      }
      
      return result
    },
    null
  )

  return (
    <Card>
      <form action={formAction} className="max-w-2xl space-y-6">
        {/* Error Message */}
        {state?.error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
            {state.error}
          </div>
        )}

        {/* Project Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-900 mb-2"
          >
            Project Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="e.g., Marketing Website Redesign"
            required
            disabled={isPending}
            className={cn(
              'w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-900',
              'focus:ring-2 focus:ring-black focus:border-transparent outline-none',
              'disabled:bg-gray-50 disabled:text-gray-500',
              'placeholder:text-gray-400'
            )}
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-900 mb-2"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            placeholder="Describe the project..."
            rows={4}
            disabled={isPending}
            className={cn(
              'w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-900',
              'focus:ring-2 focus:ring-black focus:border-transparent outline-none',
              'disabled:bg-gray-50 disabled:text-gray-500',
              'placeholder:text-gray-400 resize-none'
            )}
          />
        </div>

        {/* Template Selection (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Template
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'kanban', label: 'Kanban' },
              { id: 'agile', label: 'Agile' },
              { id: 'waterfall', label: 'Waterfall' },
            ].map((template) => (
              <label
                key={template.id}
                className="relative flex cursor-pointer rounded-lg border border-gray-300 p-3 hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name="template"
                  value={template.id}
                  defaultChecked={template.id === 'kanban'}
                  disabled={isPending}
                  className="radio radio-sm"
                />
                <span className="ml-2 text-sm font-medium text-gray-900">
                  {template.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            'w-full px-4 py-3 rounded-lg font-semibold text-white',
            'bg-black hover:bg-gray-900 transition-colors',
            'disabled:bg-gray-400 disabled:cursor-not-allowed',
            'focus:ring-2 focus:ring-black focus:ring-offset-2 outline-none'
          )}
        >
          {isPending ? 'Creating...' : 'Create Project'}
        </button>
      </form>
    </Card>
  )
}
