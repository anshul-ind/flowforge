import { Project, ProjectStatus, User } from '@/lib/generated/prisma';

/**
 * Project with metadata (task count, owner)
 * Used for project detail pages and listings
 */
export type ProjectWithMeta = Project & {
  _count: { tasks: number };
};

/**
 * Project filter for list and search operations
 */
export type ProjectFilter = {
  status?: ProjectStatus;
  // Extensible for future: search, owner, dateRange, etc.
};
