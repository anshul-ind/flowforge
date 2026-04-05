import { prisma } from '@/lib/db'

/**
 * Organization-scoped reads. Callers enforce auth; this layer only loads data by id.
 */
export class OrganizationRepository {
  static async findWorkspaceTenantSummary(workspaceId: string) {
    return prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true, name: true, organizationId: true },
    })
  }

  static async findOrganizationById(organizationId: string) {
    return prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, slug: true },
    })
  }
}
