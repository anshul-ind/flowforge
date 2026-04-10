-- Optional navigation / listing restrictions from scoped workspace invites
ALTER TABLE "WorkspaceMember" ADD COLUMN "restrictedProjectId" TEXT;
ALTER TABLE "WorkspaceMember" ADD COLUMN "restrictedTaskId" TEXT;
