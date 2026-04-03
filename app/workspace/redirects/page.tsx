import { requireUser } from '@/lib/auth/require-user';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';

/**
 * Smart Redirect Page
 * 
 * This page determines where to send users after login based on:
 * 1. Their role in their workspace(s)
 * 2. Number of workspaces
 * 3. Special roles (owner, manager, etc.)
 */
export default async function RedirectPage() {
  const user = await requireUser();

  // Get all workspaces where user is a member
  const workspaces = await prisma.workspaceMember.findMany({
    where: {
      userId: user.id,
    },
    include: {
      workspace: true,
    },
  });

  // If no workspaces, create a personal workspace
  if (workspaces.length === 0) {
    // Redirect to workspace creation
    redirect('/workspace/new');
  }

  // Find the primary workspace (personal workspace or first organization)
  let primaryWorkspace = workspaces[0];
  const isOwner = primaryWorkspace.role === 'OWNER';
  const isManager = primaryWorkspace.role === 'MANAGER';
  const isMember = primaryWorkspace.role === 'MEMBER';

  // Redirect based on role
  if (isOwner) {
    // Owners go to analytics dashboard
    redirect(`/workspace/${primaryWorkspace.workspaceId}/analytics`);
  } else if (isManager) {
    // Managers go to workspace home
    redirect(`/workspace/${primaryWorkspace.workspaceId}`);
  } else if (isMember) {
    // Members go to workspace home
    redirect(`/workspace/${primaryWorkspace.workspaceId}`);
  } else {
    // Viewers go to workspace home
    redirect(`/workspace/${primaryWorkspace.workspaceId}`);
  }
}
