-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'MENTION_ADDED';

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "entityType" TEXT,
ADD COLUMN     "entityId" TEXT;
