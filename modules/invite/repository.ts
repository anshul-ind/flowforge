import { prisma } from '@/lib/db'
import type { Prisma } from '@/lib/generated/prisma'

const workspaceAcceptInclude = {
  select: { id: true, name: true, organizationId: true },
} as const

export class InviteRepository {
  static create(data: Prisma.InviteUncheckedCreateInput) {
    return prisma.invite.create({ data })
  }

  static findByTokenHashForAccept(tokenHash: string) {
    return prisma.invite.findUnique({
      where: { tokenHash },
      include: { workspace: workspaceAcceptInclude },
    })
  }

  static markAccepted(tx: Prisma.TransactionClient, inviteId: string) {
    return tx.invite.update({
      where: { id: inviteId },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    })
  }

  static markAcceptedOutsideTx(inviteId: string) {
    return prisma.invite.update({
      where: { id: inviteId },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    })
  }
}
