import Link from 'next/link';
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
 * Project Card Component
 * 
 * Clickable card displaying a project summary
 * Links to project detail page on click
 */
export function ProjectCard({
  project,
  workspaceId,
}: {
  project: Project;
  workspaceId: string;
}) {
  const statusStyle = STATUS_STYLES[project.status] || STATUS_STYLES.PLANNED;

  return (
    <Link href={`/workspace/${workspaceId}/project/${project.id}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 flex-1">{project.name}</h3>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
        )}

        {/* Footer: status and date */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
              <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`}></span>
              {project.status}
            </span>
          </div>

          <span className="text-xs text-gray-400">
            {project.createdAt.toLocaleDateString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
