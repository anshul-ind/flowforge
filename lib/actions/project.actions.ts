'use server';

import { auth } from '@/auth';
import { getWorkspaceContext } from '@/lib/tenancy/workspace-context';
import { requirePermission } from '@/lib/permissions/rbac';
import { revalidatePath } from 'next/cache';

interface CreateProjectInput {
  workspaceId: string;
  title: string;
  description?: string;
  dueDate?: string;
}

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Create a new project in the workspace
 * Requires: create_project permission
 * Consistency: STRONG (persists before response)
 */
export async function createProjectAction(
  input: CreateProjectInput
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized - must be logged in',
      };
    }

    // Resolve workspace context
    const context = await getWorkspaceContext(session, input.workspaceId);
    if (!context) {
      return {
        success: false,
        error: 'Workspace not found or access denied',
      };
    }

    // Check permission
    try {
      requirePermission(context.role, 'create_project');
    } catch (error) {
      return {
        success: false,
        error: 'Insufficient permissions to create project',
      };
    }

    // TODO: In production, insert project to DB here
    // const project = await db.project.create({
    //   data: {
    //     workspaceId: input.workspaceId,
    //     title: input.title,
    //     description: input.description,
    //     dueDate: input.dueDate ? new Date(input.dueDate) : null,
    //     createdBy: session.user.id,
    //   },
    // });

    // TODO: Append audit log
    // await db.auditLog.create({
    //   data: {
    //     workspaceId: input.workspaceId,
    //     actorId: session.user.id,
    //     action: 'create_project',
    //     entityType: 'Project',
    //     entityId: project.id,
    //     metadata: { title: input.title },
    //   },
    // });

    // Revalidate project list page
    revalidatePath(`/workspace/${input.workspaceId}/projects`);

    return {
      success: true,
      message: 'Project created successfully',
    };
  } catch (error) {
    console.error('[createProjectAction]', error);
    return {
      success: false,
      error: 'Failed to create project',
    };
  }
}

/**
 * Archive a project
 * Requires: archive_project permission
 */
export async function archiveProjectAction(
  workspaceId: string,
  projectId: string
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const context = await getWorkspaceContext(session, workspaceId);
    if (!context) {
      return {
        success: false,
        error: 'Access denied',
      };
    }

    requirePermission(context.role, 'archive_project');

    // TODO: DB update
    // await db.project.update({
    //   where: { id: projectId, workspaceId },
    //   data: { archived: true },
    // });

    // TODO: Audit log
    revalidatePath(`/workspace/${workspaceId}/projects`);

    return {
      success: true,
      message: 'Project archived',
    };
  } catch (error) {
    console.error('[archiveProjectAction]', error);
    return {
      success: false,
      error: String(error).includes('Insufficient') ? String(error) : 'Failed to archive project',
    };
  }
}
