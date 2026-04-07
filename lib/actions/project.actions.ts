'use server';

import { auth } from '@/auth';
import { getWorkspaceContext } from '@/lib/tenancy/workspace-context';
import { requirePermission } from '@/lib/permissions/rbac';
import { resolveTenantContext } from '@/lib/tenant/resolve-tenant';
import { ProjectService } from '@/modules/project/service';
import { ForbiddenError, NotFoundError } from '@/lib/errors/authorization';
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

    const tenant = await resolveTenantContext(workspaceId, session.user.id);
    if (!tenant) {
      return {
        success: false,
        error: 'Access denied',
      };
    }

    const service = new ProjectService(tenant);
    await service.archiveProject(projectId);

    revalidatePath(`/workspace/${workspaceId}/projects`);
    revalidatePath(`/workspace/${workspaceId}/projects/${projectId}`);

    return {
      success: true,
      message: 'Project archived',
    };
  } catch (error) {
    console.error('[archiveProjectAction]', error);
    if (error instanceof ForbiddenError) {
      return { success: false, error: error.message };
    }
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: String(error).includes('Insufficient') ? String(error) : 'Failed to archive project',
    };
  }
}
