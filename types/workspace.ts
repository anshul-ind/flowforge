import { Workspace, WorkspaceMember, User, WorkspaceRole } from '@/lib/generated/prisma';

/**
 * Workspace with members and project count
 * Used for workspace overview pages
 */
export type WorkspaceWithMembers = Workspace & {
  members: MemberWithUser[];
  _count: { projects: number };
};

/**
 * WorkspaceMember augmented with user details
 * Always use this when you need member + user info together
 */
export type MemberWithUser = WorkspaceMember & {
  user: Pick<User, 'id' | 'email' | 'name'>;
};

/**
 * Workspace filter for list operations
 */
export type WorkspaceFilter = {
  // Currently no filters, but extensible for future
};
