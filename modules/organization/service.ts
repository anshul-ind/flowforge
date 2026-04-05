import { NotFoundError } from '@/lib/errors'
import { OrganizationRepository } from './repository'

/**
 * Thin facade for organization context used by invites and tenancy.
 */
export class OrganizationService {
  static async requireWorkspaceTenant(workspaceId: string) {
    const row = await OrganizationRepository.findWorkspaceTenantSummary(workspaceId)
    if (!row) {
      throw new NotFoundError('Workspace not found')
    }
    return row
  }
}
