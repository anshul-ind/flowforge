import { prisma } from '@/lib/db'
import type { Prisma } from '@/lib/generated/prisma'

const workspaceAcceptInclude = {
  select: { id: true, name: true, organizationId: true },
} as const

export class InviteRepository {
  static create(data: Prisma.WorkspaceInviteUncheckedCreateInput) {
    return prisma.workspaceInvite.create({ data })
  }

  static findByTokenHashForAccept(tokenHash: string) {
    return prisma.workspaceInvite.findUnique({
      where: { tokenHash },
      include: { workspace: workspaceAcceptInclude },
    })
  }

  static markAccepted(tx: Prisma.TransactionClient, inviteId: string) {
    return tx.workspaceInvite.update({
      where: { id: inviteId },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    })
  }

  static markAcceptedOutsideTx(inviteId: string) {
    return prisma.workspaceInvite.update({
      where: { id: inviteId },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    })
  }
}
