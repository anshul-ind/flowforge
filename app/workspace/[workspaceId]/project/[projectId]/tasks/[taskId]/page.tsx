import { EmptyState } from '@/components/ui/empty-state';

/**
 * Task Detail Page
 * 
 * Placeholder for Phase-7 task detail view
 * Will show task details, comments, approvals
 */
export default function TaskPage({
  params,
}: {
  params: Readonly<{ workspaceId: string; projectId: string; taskId: string }>;
}) {
  return (
    <div className="space-y-6">
      <EmptyState
        title="Task Detail"
        description="Task detail view coming in Phase-7"
      />
    </div>
  );
}
