import { Project } from '@/lib/generated/prisma';
import { ProjectCard } from './project-card';
import { EmptyState } from '@/components/ui/empty-state';

/**
 * Project List Component
 * 
 * Renders projects as a responsive grid
 * Shows empty state if no projects
 */
export function ProjectList({
  projects,
  workspaceId,
}: {
  projects: Project[];
  workspaceId: string;
}) {
  if (!projects || projects.length === 0) {
    return (
      <EmptyState
        title="No projects yet"
        description="Create your first project to get started"
        action={{ label: 'New Project', href: '#' }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          workspaceId={workspaceId}
        />
      ))}
    </div>
  );
}
