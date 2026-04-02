import { requireUser } from '@/lib/auth/require-user';
import { CreateWorkspaceForm } from '@/components/workspace/create-workspace-form';

/**
 * Create Workspace Page
 * 
 * Form for creating a new workspace
 */
export default async function CreateWorkspacePage() {
  const user = await requireUser();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Create Workspace</h1>
        <p className="text-gray-500 mt-1">
          Create a new workspace to organize your projects
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <CreateWorkspaceForm />
      </div>
    </div>
  );
}
