import { Project } from '@/lib/generated/prisma';

/**
 * Status badge styling
 */
const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  PLANNED: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400' },
  ACTIVE: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  ON_HOLD: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  COMPLETED: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  ARCHIVED: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
};

/**
 * Project Header Component
 * 
 * Displays project name, status, and description
 * Shown at the top of project detail pages
 */
export function ProjectHeader({ project }: { project: Project }) {
  const statusStyle = STATUS_STYLES[project.status] || STATUS_STYLES.PLANNED;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>

          {project.description && (
            <p className="text-gray-600 mt-2 max-w-2xl">{project.description}</p>
          )}

          <div className="flex items-center gap-4 mt-4">
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
              <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`}></span>
              {project.status}
            </span>

            <span className="text-sm text-gray-500">
              Created {project.createdAt.toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Future: action buttons (edit, archive, etc.) */}
      </div>
    </div>
  );
}
