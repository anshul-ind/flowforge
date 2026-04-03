/*
  Warnings:

  - You are about to drop the column `approverId` on the `ApprovalRequest` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `ApprovalRequest` table. All the data in the column will be lost.
  - You are about to drop the column `requesterId` on the `ApprovalRequest` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `ApprovalRequest` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ApprovalRequest` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `editedAt` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the `CommentReaction` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[commentId,mentionedUserId]` on the table `Mention` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `submittedById` to the `ApprovalRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `authorId` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `body` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'INVITE_SENT';
ALTER TYPE "NotificationType" ADD VALUE 'INVITE_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'COMMENT_MENTION';
ALTER TYPE "NotificationType" ADD VALUE 'TASK_SUBMITTED';
ALTER TYPE "NotificationType" ADD VALUE 'TASK_DUE_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE 'TASK_OVERDUE';

-- DropForeignKey
ALTER TABLE "ApprovalRequest" DROP CONSTRAINT "ApprovalRequest_approverId_fkey";

-- DropForeignKey
ALTER TABLE "ApprovalRequest" DROP CONSTRAINT "ApprovalRequest_requesterId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- DropForeignKey
ALTER TABLE "CommentReaction" DROP CONSTRAINT "CommentReaction_commentId_fkey";

-- DropForeignKey
ALTER TABLE "CommentReaction" DROP CONSTRAINT "CommentReaction_userId_fkey";

-- DropIndex
DROP INDEX "ApprovalRequest_workspaceId_idx";

-- DropIndex
DROP INDEX "ApprovalRequest_workspaceId_taskId_idx";

-- DropIndex
DROP INDEX "Comment_workspaceId_idx";

-- DropIndex
DROP INDEX "Comment_workspaceId_taskId_idx";

-- DropIndex
DROP INDEX "Project_workspaceId_idx";

-- DropIndex
DROP INDEX "Task_workspaceId_idx";

-- AlterTable
ALTER TABLE "ApprovalRequest" DROP COLUMN "approverId",
DROP COLUMN "notes",
DROP COLUMN "requesterId",
DROP COLUMN "title",
DROP COLUMN "updatedAt",
ADD COLUMN     "actedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "reviewerId" TEXT,
ADD COLUMN     "submitNote" TEXT,
ADD COLUMN     "submittedById" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "content",
DROP COLUMN "deletedAt",
DROP COLUMN "editedAt",
DROP COLUMN "userId",
ADD COLUMN     "authorId" TEXT NOT NULL,
ADD COLUMN     "body" TEXT NOT NULL,
ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "name",
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "submittedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WorkspaceMember" ADD COLUMN     "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE';

-- DropTable
DROP TABLE "CommentReaction";

-- CreateTable
CREATE TABLE "WorkspaceInvite" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "token" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workspaceId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,

    CONSTRAINT "WorkspaceInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceInvite_token_key" ON "WorkspaceInvite"("token");

-- CreateIndex
CREATE INDEX "WorkspaceInvite_workspaceId_token_idx" ON "WorkspaceInvite"("workspaceId", "token");

-- CreateIndex
CREATE INDEX "ApprovalRequest_workspaceId_reviewerId_status_idx" ON "ApprovalRequest"("workspaceId", "reviewerId", "status");

-- CreateIndex
CREATE INDEX "ApprovalRequest_taskId_status_idx" ON "ApprovalRequest"("taskId", "status");

-- CreateIndex
CREATE INDEX "AuditLog_workspaceId_createdAt_idx" ON "AuditLog"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_workspaceId_taskId_createdAt_idx" ON "Comment"("workspaceId", "taskId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Mention_commentId_mentionedUserId_key" ON "Mention"("commentId", "mentionedUserId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Project_workspaceId_createdAt_idx" ON "Project"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "Task_workspaceId_assigneeId_idx" ON "Task"("workspaceId", "assigneeId");

-- CreateIndex
CREATE INDEX "Task_workspaceId_status_dueDate_idx" ON "Task"("workspaceId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");

-- CreateIndex
CREATE INDEX "WorkspaceMember_workspaceId_role_idx" ON "WorkspaceMember"("workspaceId", "role");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceInvite" ADD CONSTRAINT "WorkspaceInvite_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
